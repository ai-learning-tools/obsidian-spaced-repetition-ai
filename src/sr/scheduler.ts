import { SRSettings } from "@/settings";

export enum ReviewResponse {
  Easy,
  Good,
  Hard,
  Reset,
}

export function schedule(
  response: ReviewResponse,
  interval: number,
  ease: number,
  delayBeforeReview: number,
  settingsObj: SRSettings,
  dueDates?: Record<number, number>,
): Record<string, number> {
  delayBeforeReview = Math.max(0, Math.floor(delayBeforeReview / (24 * 3600 * 1000)));

  if (response === ReviewResponse.Easy) {
      ease += 20;
      interval = ((interval + delayBeforeReview) * ease) / 100;
      interval *= settingsObj.easyBonus;
  } else if (response === ReviewResponse.Good) {
      interval = ((interval + delayBeforeReview / 2) * ease) / 100;
  } else if (response === ReviewResponse.Hard) {
      ease = Math.max(130, ease - 20);
      interval = Math.max(
          1,
          (interval + delayBeforeReview / 4) * settingsObj.lapsesIntervalChange,
      );
  }

  // replaces random fuzz with load balancing over the fuzz interval
  if (dueDates !== undefined) {
      interval = Math.round(interval);
      if (!Object.prototype.hasOwnProperty.call(dueDates, interval)) {
          dueDates[interval] = 0;
      } else {
          // disable fuzzing for small intervals
          if (interval > 4) {
              let fuzz = 0;
              if (interval < 7) fuzz = 1;
              else if (interval < 30) fuzz = Math.max(2, Math.floor(interval * 0.15));
              else fuzz = Math.max(4, Math.floor(interval * 0.05));

              const originalInterval = interval;
              outer: for (let i = 1; i <= fuzz; i++) {
                  for (const ivl of [originalInterval - i, originalInterval + i]) {
                      if (!Object.prototype.hasOwnProperty.call(dueDates, ivl)) {
                          dueDates[ivl] = 0;
                          interval = ivl;
                          break outer;
                      }
                      if (dueDates[ivl] < dueDates[interval]) interval = ivl;
                  }
              }
          }
      }

      dueDates[interval]++;
  }

  interval = Math.min(interval, settingsObj.maximumInterval);

  return { interval: Math.round(interval * 10) / 10, ease };
}

// TODO: add in fsrs scheduler
export class FSRSScheduler {
  private static instance: FSRSScheduler;

  private constructor() {

  }

  getInstance() {
    if (!FSRSScheduler.instance) {
      FSRSScheduler.instance = new FSRSScheduler();
    }
    return FSRSScheduler.instance;
  }
}