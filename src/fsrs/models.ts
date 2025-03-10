export type StateType = 'New' | 'Learning' | 'Review' | 'Relearning'

export enum State {
  New = 0,
  Learning = 1,
  Review = 2,
  Relearning = 3,
}

export type RatingType = 'Manual' | 'Again' | 'Hard' | 'Good' | 'Easy'

export enum Rating {
  Manual = 0,
  Again = 1,
  Hard = 2,
  Good = 3,
  Easy = 4,
}

type ExcludeManual<T> = Exclude<T, Rating.Manual>

export type Grade = ExcludeManual<Rating>

export interface ReviewLog {
  rating: Rating // Rating of the review (Again, Hard, Good, Easy)
  state: State // State of the review (New, Learning, Review, Relearning)
  due: Date // Date of the last scheduling, this means a different thing from Card's due which can be confusing
  stability: number // Memory stability during the review
  difficulty: number // Difficulty of the card during the review
  elapsed_days: number // Number of days elapsed since the last review
  last_elapsed_days: number // Number of days between the last two reviews
  scheduled_days: number // Number of days until the next review
  review: Date // Date of the review
}

export type RecordLogItem = {
  card: Card
  log: ReviewLog
}
export type RecordLog = {
  [key in Grade]: RecordLogItem
}

export interface DeckMetaData {
  rootPath: string, 
  name: string,
}

export enum EntryType {
  Multiline = 'Multiline',
  Inline = 'inline',
}

export interface Entry {
  front: string, 
  back: string, 
  id?: string,
  path: string, 
  isNew?: boolean, // this is true if card is new and `id` was randomly assigned
  lineToAddId?: number, // `line` of file in `path` to add the newly assigned ID, is undefined if card already has `id`
  entryType: EntryType // enum to indicate if the entry is multi-line or single-line
}

// Card is entry + space repetition data
export interface Card extends Entry {
  due: Date // Due date
  stability: number // Stability
  difficulty: number // Difficulty level
  elapsed_days: number // Number of days elapsed - number of days between last reviews
  scheduled_days: number // Number of days scheduled - number of days till supposed next review
  reps: number // Repetition count
  lapses: number // Number of lapses or mistakes
  state: State // Card's state (New, Learning, Review, Relearning)
  last_review?: Date // Date of the last review (optional)
}

export interface CardInput extends Omit<Card, 'state' | 'due' | 'last_review'> {
  state: StateType | State // Card's state (New, Learning, Review, Relearning)
  due: DateInput // Due date
  last_review?: DateInput | null // Date of the last review (optional)
}

export type DateInput = Date | number | string

export interface ReviewLogInput
  extends Omit<ReviewLog, 'rating' | 'state' | 'due' | 'review'> {
  rating: RatingType | Rating // Rating of the review (Again, Hard, Good, Easy)
  state: StateType | State // Card's state (New, Learning, Review, Relearning)
  due: DateInput // Due date
  review: DateInput // Date of the last review
}

export interface FSRSParameters {
  request_retention: number
  maximum_interval: number
  w: number[]
  enable_fuzz: boolean
  enable_short_term: boolean
}

export type RescheduleOptions = {
  enable_fuzz?: boolean
  dateHandler?: (date: Date) => DateInput
}
