import { generatorParameters } from './default'
import { FSRSParameters, Grade, Rating } from './models'
import type { int } from './types'
import { get_fuzz_range } from './help'
import { alea } from './alea'

/**
 * @default DECAY = -0.5
 */
export const DECAY = -0.5
/**
 * FACTOR = Math.pow(0.9, 1 / DECAY) - 1= 19 / 81
 *
 * $$\text{FACTOR} = \frac{19}{81}$$
 * @default FACTOR = 19 / 81
 */
export const FACTOR: number = 19 / 81

/**
 * @see https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm#fsrs-45
 */
export class FSRSAlgorithm {
  protected param!: FSRSParameters
  protected intervalModifier!: number
  protected _seed?: string

  constructor(params: Partial<FSRSParameters>) {
    this.param = new Proxy(
      generatorParameters(params),
      this.params_handler_proxy()
    )
    this.intervalModifier = this.calculate_interval_modifier(
      this.param.request_retention
    )
  }

  get interval_modifier(): number {
    return this.intervalModifier
  }

  set seed(seed: string) {
    this._seed = seed
  }

  /**
   * @see https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm#fsrs-45
   *
   * The formula used is: $$I(r,s) = (r^{\frac{1}{DECAY}} - 1) / FACTOR \times s$$
   * @param request_retention 0<request_retention<=1,Requested retention rate
   * @throws {Error} Requested retention rate should be in the range (0,1]
   */
  calculate_interval_modifier(request_retention: number): number {
    if (request_retention <= 0 || request_retention > 1) {
      throw new Error('Requested retention rate should be in the range (0,1]')
    }
    return +((Math.pow(request_retention, 1 / DECAY) - 1) / FACTOR).toFixed(8)
  }

  /**
   * Get the parameters of the algorithm.
   */
  get parameters(): FSRSParameters {
    return this.param
  }

  /**
   * Set the parameters of the algorithm.
   * @param params Partial<FSRSParameters>
   */
  set parameters(params: Partial<FSRSParameters>) {
    this.update_parameters(params)
  }

  protected params_handler_proxy(): ProxyHandler<FSRSParameters> {
    const _this = this satisfies FSRSAlgorithm
    return {
      set: function (
        target: FSRSParameters,
        prop: keyof FSRSParameters,
        value: FSRSParameters[keyof FSRSParameters]
      ) {
        if (prop === 'request_retention' && Number.isFinite(value)) {
          _this.intervalModifier = _this.calculate_interval_modifier(
            Number(value)
          )
        }
        Reflect.set(target, prop, value)
        return true
      },
    }
  }

  private update_parameters(params: Partial<FSRSParameters>): void {
    const _params = generatorParameters(params)
    for (const key in _params) {
      if (key in this.param) {
        const paramKey = key as keyof FSRSParameters
        this.param[paramKey] = _params[paramKey] as never
      }
    }
  }

  /**
   * The formula used is :
   * $$ S_0(G) = w_{G-1}$$
   * $$S_0 = \max \lbrace S_0,0.1\rbrace $$

   * @param g Grade (rating at Anki) [1.again,2.hard,3.good,4.easy]
   * @return Stability (interval when R=90%)
   */
  init_stability(g: Grade): number {
    return Math.max(this.param.w[g - 1], 0.1)
  }

  /**
   * The formula used is :
   * $$D_0(G) = w_4 - e^{(G-1) \cdot w_5} + 1 $$
   * $$D_0 = \min \lbrace \max \lbrace D_0(G),1 \rbrace,10 \rbrace$$
   * where the $$D_0(1)=w_4$$ when the first rating is good.
   *
   * @param {Grade} g Grade (rating at Anki) [1.again,2.hard,3.good,4.easy]
   * @return {number} Difficulty $$D \in [1,10]$$
   */
  init_difficulty(g: Grade): number {
    return this.constrain_difficulty(
      this.param.w[4] - Math.exp((g - 1) * this.param.w[5]) + 1
    )
  }

  /**
   * If fuzzing is disabled or ivl is less than 2.5, it returns the original interval.
   * @param {number} ivl - The interval to be fuzzed.
   * @param {number} elapsed_days t days since the last review
   * @param {number} enable_fuzz - This adds a small random delay to the new interval time to prevent cards from sticking together and always being reviewed on the same day.
   * @return {number} - The fuzzed interval.
   **/
  apply_fuzz(ivl: number, elapsed_days: number, enable_fuzz?: boolean): int {
    if (!enable_fuzz || ivl < 2.5) return Math.round(ivl) as int
    const generator = alea(this.seed)
    const fuzz_factor = generator()
    const { min_ivl, max_ivl } = get_fuzz_range(
      ivl,
      elapsed_days,
      this.param.maximum_interval
    )
    return Math.floor(fuzz_factor * (max_ivl - min_ivl + 1) + min_ivl) as int
  }

  /**
   *   @see The formula used is : {@link FSRSAlgorithm.calculate_interval_modifier}
   *   @param {number} s - Stability (interval when R=90%)
   *   @param {number} elapsed_days t days since the last review
   *   @param {number} enable_fuzz - This adds a small random delay to the new interval time to prevent cards from sticking together and always being reviewed on the same day.
   */
  next_interval(
    s: number,
    elapsed_days: number,
    enable_fuzz: boolean = this.param.enable_fuzz
  ): int {
    const newInterval = Math.min(
      Math.max(1, Math.round(s * this.intervalModifier)), // interval Modifier is the same constant we see in v 4.5
      this.param.maximum_interval
    ) as int
    return this.apply_fuzz(newInterval, elapsed_days, enable_fuzz)
  }

  /**
   * The formula used is :
   * $$\text{next}_d = D - w_6 \cdot (g - 3)$$
   * $$D^\prime(D,R) = w_7 \cdot D_0(4) +(1 - w_7) \cdot \text{next}_d$$
   * @param {number} d Difficulty $$D \in [1,10]$$
   * @param {Grade} g Grade (rating at Anki) [1.again,2.hard,3.good,4.easy]
   * @return {number} $$\text{next}_D$$
   */
  next_difficulty(d: number, g: Grade): number {
    const next_d = d - this.param.w[6] * (g - 3)
    return this.constrain_difficulty(
      this.mean_reversion(this.init_difficulty(Rating.Easy), next_d)
    )
  }

  /**
   * The formula used is :
   * $$\min \lbrace \max \lbrace D_0,1 \rbrace,10\rbrace$$
   * @param {number} difficulty $$D \in [1,10]$$
   */
  constrain_difficulty(difficulty: number): number {
    return Math.min(Math.max(+difficulty.toFixed(8), 1), 10)
  }

  /**
   * The formula used is :
   * $$w_7 \cdot \text{init} +(1 - w_7) \cdot \text{current}$$
   * @param {number} init $$w_2 : D_0(3) = w_2 + (R-2) \cdot w_3= w_2$$
   * @param {number} current $$D - w_6 \cdot (R - 2)$$
   * @return {number} difficulty
   */
  mean_reversion(init: number, current: number): number {
    return +(this.param.w[7] * init + (1 - this.param.w[7]) * current).toFixed(
      8
    )
  }

  /**
   * The formula used is :
   * $$S^\prime_r(D,S,R,G) = S\cdot(e^{w_8}\cdot (11-D)\cdot S^{-w_9}\cdot(e^{w_{10}\cdot(1-R)}-1)\cdot w_{15}(\text{if} G=2) \cdot w_{16}(\text{if} G=4)+1)$$
   * @param {number} d Difficulty D \in [1,10]
   * @param {number} s Stability (interval when R=90%)
   * @param {number} r Retrievability (probability of recall)
   * @param {Grade} g Grade (Rating[0.again,1.hard,2.good,3.easy])
   * @return {number} S^\prime_r new stability after recall
   */
  next_recall_stability(d: number, s: number, r: number, g: Grade): number {
    const hard_penalty = Rating.Hard === g ? this.param.w[15] : 1
    const easy_bound = Rating.Easy === g ? this.param.w[16] : 1
    return +(
      s *
      (1 +
        Math.exp(this.param.w[8]) *
          (11 - d) *
          Math.pow(s, -this.param.w[9]) *
          (Math.exp((1 - r) * this.param.w[10]) - 1) *
          hard_penalty *
          easy_bound)
    ).toFixed(8)
  }

  /**
   * The formula used is :
   * $$S^\prime_f(D,S,R) = w_{11}\cdot D^{-w_{12}}\cdot ((S+1)^{w_{13}}-1) \cdot e^{w_{14}\cdot(1-R)}$$
   * @param {number} d Difficulty D \in [1,10]
   * @param {number} s Stability (interval when R=90%)
   * @param {number} r Retrievability (probability of recall)
   * @return {number} S^\prime_f new stability after forgetting
   */
  next_forget_stability(d: number, s: number, r: number): number {
    return +(
      this.param.w[11] *
      Math.pow(d, -this.param.w[12]) *
      (Math.pow(s + 1, this.param.w[13]) - 1) *
      Math.exp((1 - r) * this.param.w[14])
    ).toFixed(8)
  }

  /**
   * The formula used is :
   * $$S^\prime_s(S,G) = S \cdot e^{w_{17} \cdot (G-3+w_{18})}$$
   * @param {number} s Stability (interval when R=90%)
   * @param {Grade} g Grade (Rating[0.again,1.hard,2.good,3.easy])
   */
  next_short_term_stability(s: number, g: Grade): number {
    return +(
      s * Math.exp(this.param.w[17] * (g - 3 + this.param.w[18]))
    ).toFixed(8)
  }

  /**
   * The formula used is :
   * $$R(t,S) = (1 + \text{FACTOR} \times \frac{t}{9 \cdot S})^{\text{DECAY}}$$
   * @param {number} elapsed_days t days since the last review
   * @param {number} stability Stability (interval when R=90%)
   * @return {number} r Retrievability (probability of recall)
   */
  forgetting_curve(elapsed_days: number, stability: number): number {
    return +Math.pow(1 + (FACTOR * elapsed_days) / stability, DECAY).toFixed(8)
  }
}
