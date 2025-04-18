declare module 'clarifai' {
  export class App {
    constructor(options: { apiKey: string });
    models: {
      predict: (modelId: string, input: { url?: string; base64?: string }) => Promise<PredictResponse>;
    };
  }

  interface Concept {
    id: string;
    name: string;
    value: number;
    app_id: string;
  }

  interface Region {
    id: string;
    region_info: {
      bounding_box: {
        top_row: number;
        left_col: number;
        bottom_row: number;
        right_col: number;
      };
    };
    data: {
      concepts: Concept[];
    };
  }

  interface Output {
    id: string;
    status: {
      code: number;
      description: string;
    };
    created_at: string;
    model: {
      id: string;
      name: string;
      created_at: string;
      app_id: string;
      output_info: {
        output_config: {
          concepts_mutually_exclusive: boolean;
          closed_environment: boolean;
        };
        message: string;
        type: string;
        type_ext: string;
      };
      model_version: {
        id: string;
        created_at: string;
        status: {
          code: number;
          description: string;
        };
      };
    };
    input: {
      id: string;
      data: {
        image: {
          url: string;
        };
      };
    };
    data: {
      concepts: Concept[];
      regions?: Region[];
    };
  }

  interface PredictResponse {
    id: string;
    status: {
      code: number;
      description: string;
    };
    outputs: Output[];
  }

  export default { App };
}