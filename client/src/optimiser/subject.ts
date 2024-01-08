export interface Subject {
  code: string;
  name: string;
  year: number;
  offering: string;
  activity_list: Activity[];
}

export interface Activity {
  atype: string;
  name: string;
  stream_list: Stream[];
}

export interface Stream {
  code: number;
  weeks: Week[];
  day: Day;
  times: {
    start: string;
    end: string;
  };
  location: string;
  online: boolean;
}

export type Week = number;
export enum Day {
  Mon = "Mon",
  Tue = "Tue",
  Wed = "Wed",
  Thu = "Thu",
  Fri = "Fri",
  Sat = "Sat",
  Sun = "Sun",
}
