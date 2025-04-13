import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

import Ajv from "ajv";
import AjvFormats from "ajv-formats";
import { ValidationError } from "../components/SchemaGrid/SchemaGrid";

/**
 * Helper function to validate a single data object against a JSON schema
 * @param data The data object to validate
 * @param schema The JSON schema to validate against
 * @returns Array of validation errors, if any
 */
export function validateDataWithSchema(
  data: Record<string, any>,
  schema: Record<string, any>,
): ValidationError[] {
  const ajv = new Ajv({ allErrors: true });
  AjvFormats(ajv); // Add support for formats

  const errors: ValidationError[] = [];
  const requiredFields = schema.required || [];

  // Process each field according to its schema
  Object.keys(schema.properties).forEach((field) => {
    const value = data[field];
    const isRequired = requiredFields.includes(field);

    // Handle required fields
    if (isRequired) {
      if (value === null || value === undefined || value === "") {
        errors.push({ field, message: `${field} is required` });
        return; // Skip further validation for this field if it's missing
      }
    } else {
      // Skip validation for non-required fields that are null/undefined
      if (value === null || value === undefined) {
        return;
      }
    }

    // Validate field against its schema
    const fieldSchema = schema.properties[field];
    const ajvValidate = ajv.compile(fieldSchema);
    const isValid = ajvValidate(value);

    if (!isValid && ajvValidate.errors) {
      ajvValidate.errors.forEach((error) => {
        errors.push({
          field,
          message: error.message || `Invalid ${field}`,
        });
      });
    }
  });

  return errors;
}

/**
 * Helper function to generate column definitions from a JSON schema
 * @param schema The JSON schema to generate columns from
 * @returns An array of column definitions based on the schema properties
 */
export function generateColumnsFromSchema(schema: Record<string, any>) {
  return Object.entries(schema.properties).map(([field, fieldSchema]) => {
    const colDef = {
      field,
      headerName: (fieldSchema as any).title || field,
      // ... other default properties
    };

    return colDef;
  });
}
