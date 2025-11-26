export enum Sender {
  User = 'user',
  Model = 'model'
}

export interface ChatMessage {
  id: string;
  role: Sender;
  text: string;
  timestamp: number;
  isError?: boolean;
}

export interface SplineLoadState {
  loaded: boolean;
  error: boolean;
}