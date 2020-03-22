export interface SheetResponse {
  news: News[];
}

export interface News {
  id: number;
  link: string;
  title: string;
  image: string;
  date: Date;
  site: string;
  domain?: string;
}
