export type MyRPCSchema = {
  bun: {
    requests: {
      launchDTU: {
        params: void;
        response: boolean;
      };
      stopDTU: {
        params: void;
        response: boolean;
      };
      selectProject: {
        params: void;
        response: string | null;
      };
      getRecentProjects: {
        params: void;
        response: string[];
      };
      getWorkflows: {
        params: { projectPath: string };
        response: { id: string; name: string }[];
      };
      runWorkflow: {
        params: { projectPath: string; workflowId: string };
        response: boolean;
      };
      stopWorkflow: {
        params: void;
        response: boolean;
      };
    };
    messages: {};
  };
  webview: {
    requests: {};
    messages: {
      dtuLog: string;
    };
  };
};
