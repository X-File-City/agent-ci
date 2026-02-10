export interface Job {
  deliveryId: string;
  eventType: string;
  repository?: {
    owner?: {
      login: string;
    };
    name: string;
  };
  env?: Record<string, string>;
  githubJobId?: number;
  githubRepo?: string;
  githubToken?: string;
  [key: string]: any;
}
