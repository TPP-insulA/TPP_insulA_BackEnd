declare module 'clarifai' {
  export class Clarifai {
    constructor(options: { apiKey: string });
    
    predict: (options: {
      modelUrl: string;
      inputs: Array<{
        data: {
          image: {
            url?: string;
            base64?: string;
          }
        }
      }>
    }) => Promise<PredictResponse>;
  }

  interface Concept {
    id: string;
    name: string;
    value: number;
    app_id?: string;
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
    status?: {
      code: number;
      description: string;
    };
    created_at?: string;
    model?: {
      id: string;
      name: string;
      created_at?: string;
      app_id?: string;
    };
    input?: {
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
    status?: {
      code: number;
      description: string;
    };
    outputs: Output[];
  }

  // Legacy support for older client
  export class App {
    constructor(options: { apiKey: string });
    models: {
      predict: (modelId: string, input: { url?: string; base64?: string }) => Promise<PredictResponse>;
    };
  }

  export default { Clarifai, App };
}