// Export SchemaGrid component and related types
export {
  SchemaGrid,
  type SchemaGridProps,
  type ValidationError,
  type ValidationErrorsMap,
} from "./components/SchemaGrid/SchemaGrid";

// Export column utilities
export { getDefaultColDef } from "./components/SchemaGrid/columnUtils";

// Export utility functions
export {
  validateDataWithSchema,
  generateColumnsFromSchema,
  cn,
} from "./lib/utils";
