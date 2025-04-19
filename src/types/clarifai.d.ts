// Types for Clarifai REST API responses
export interface ClarifaiConcept {
  id: string;
  name: string;
  value: number;
  app_id?: string;
}

export interface ClarifaiOutput {
  id: string;
  data: {
    concepts: ClarifaiConcept[];
  };
}

export interface ClarifaiResponse {
  status: {
    code: number;
    description: string;
  };
  outputs: ClarifaiOutput[];
}