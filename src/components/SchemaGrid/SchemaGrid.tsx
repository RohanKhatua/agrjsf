import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { AgGridReact } from "ag-grid-react";
import {
  ColDef,
  CellValueChangedEvent,
  ModuleRegistry,
  AllCommunityModule,
  CellClassParams,
  CellStyle,
  ITooltipParams,
  themeQuartz,
} from "ag-grid-community";
import Ajv from "ajv";
import AjvFormats from "ajv-formats";
import { getDefaultColDef } from "./columnUtils";

// Type for validation errors map
export interface ValidationErrorsMap {
  [rowId: string]: ValidationError[];
}

// Custom validation error type
export interface ValidationError {
  field: string;
  message: string;
}

export interface SchemaGridProps<T extends object> {
  // The JSON schema to validate against
  jsonSchema: Record<string, any>;
  // Data to display in the grid
  rowData: T[];
  // Optional custom column definitions
  columnDefs?: ColDef[];
  // The field to use as the unique identifier for rows
  idField?: keyof T;
  // Optional callback when validation errors occur
  onValidationError?: (errors: ValidationErrorsMap) => void;
  // Optional callback when cell values change
  onCellValueChanged?: (params: CellValueChangedEvent) => void;
  // Optional pagination settings
  pagination?: boolean;
  paginationPageSize?: number;
  // AG Grid theme, defaulting to 'ag-theme-alpine'
  theme?: string;
  // Optional height of the grid
  height?: string | number;
}

/**
 * SchemaGrid - A component that renders an AG Grid with JSON Schema validation
 */
export function SchemaGrid<T extends object>({
  jsonSchema,
  rowData,
  columnDefs,
  idField = "id" as keyof T,
  onValidationError,
  onCellValueChanged,
  pagination = true,
  paginationPageSize = 10,
  theme = "ag-theme-alpine",
  height = "400px",
}: SchemaGridProps<T>): React.ReactElement {
  // Register AG Grid modules
  ModuleRegistry.registerModules([AllCommunityModule]);

  // Initialize state
  const [validationErrors, setValidationErrors] = useState<ValidationErrorsMap>(
    {},
  );
  // Map for storing generated IDs when data doesn't have idField
  const [rowIdMap] = useState<Map<object, string>>(new Map());
  const gridRef = useRef<AgGridReact>(null);

  // Generate a unique ID for a row that doesn't have an idField
  const generateRowId = useCallback(
    (row: T): string => {
      if (!rowIdMap.has(row)) {
        rowIdMap.set(
          row,
          `generated-id-${Math.random().toString(36).substring(2, 9)}`,
        );
      }
      return rowIdMap.get(row) as string;
    },
    [rowIdMap],
  );

  // Get a row's ID, either from the idField or generated
  const getRowId = useCallback(
    (row: T): string => {
      // Use idField if it exists and has a value in the row
      const idValue = row[idField as keyof T];
      if (idValue !== undefined && idValue !== null) {
        return String(idValue);
      }

      // Otherwise use or generate a unique ID
      return generateRowId(row);
    },
    [idField, generateRowId],
  );

  // Initialize Ajv
  const ajv = useMemo(() => {
    const instance = new Ajv({ allErrors: true });
    AjvFormats(instance); // Add support for formats like "email" and "date"
    return instance;
  }, []);

  // If no custom column definitions are provided, generate them from the schema
  const generatedColumnDefs = useMemo(() => {
    if (columnDefs) return columnDefs;

    return Object.entries(jsonSchema.properties).map(([field, schema]) => {
      const baseColDef = {
        field,
        editable: true,
        headerName: (schema as any).title || field,
        // Add cell styling based on validation status
        cellStyle: (params: CellClassParams) =>
          getCellStyle(params.data, field) as CellStyle,
      };

      return getDefaultColDef(
        field,
        schema as Record<string, any>,
        baseColDef,
        jsonSchema,
      );
    });
  }, [jsonSchema, columnDefs]);

  // Validate a single row against the schema
  const validateRow = useCallback(
    (data: T): ValidationError[] => {
      const errors: ValidationError[] = [];
      const requiredFields = jsonSchema.required || [];

      // Process each field according to its schema
      Object.keys(jsonSchema.properties).forEach((field) => {
        const value = data[field as keyof T];
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
        const fieldSchema = jsonSchema.properties[field];
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
    },
    [jsonSchema, ajv],
  );

  // Get cell style based on validation errors
  const getCellStyle = (
    rowData: any,
    field: string,
  ): React.CSSProperties | null => {
    if (!rowData) return null;

    const rowId = getRowId(rowData);
    if (!validationErrors[rowId]) return null;

    const fieldErrors = validationErrors[rowId].filter(
      (err) => err.field === field,
    );

    return fieldErrors.length > 0
      ? { backgroundColor: "#ffdddd" }
      : { backgroundColor: "transparent" };
  };

  // Handle cell value changes
  const handleCellValueChanged = (params: CellValueChangedEvent): void => {
    const data = params.data as T;
    const rowId = getRowId(data);
    const errors = validateRow(data);

    setValidationErrors((prev) => ({
      ...prev,
      [rowId]: errors,
    }));

    // Call the custom handler if provided
    if (onValidationError) {
      onValidationError({
        ...validationErrors,
        [rowId]: errors,
      });
    }

    // Call the custom cell value change handler if provided
    if (onCellValueChanged) {
      onCellValueChanged(params);
    }
  };

  // Validate all rows on initial load and when data or schema changes
  useEffect(() => {
    const errors: ValidationErrorsMap = {};
    rowData.forEach((row) => {
      const rowId = getRowId(row);
      errors[rowId] = validateRow(row);
    });

    setValidationErrors(errors);

    if (onValidationError) {
      onValidationError(errors);
    }
  }, [rowData, validateRow, getRowId, onValidationError]);

  // Get error tooltip content for cells with validation errors
  const getTooltipContent = (params: ITooltipParams): string | null => {
    const data = params.data as T;
    if (!data) return null;

    const rowId = getRowId(data);
    const field = params.colDef
      ? "field" in params.colDef
        ? params.colDef.field
        : undefined
      : undefined;

    if (!field || !validationErrors[rowId]) return null;

    const fieldErrors = validationErrors[rowId].filter(
      (err) => err.field === field,
    );

    if (fieldErrors.length === 0) return null;

    return fieldErrors.map((err) => err.message).join(", ");
  };

  return (
    <div className={theme} style={{ height, width: "100%" }}>
      <AgGridReact
        ref={gridRef}
        rowData={rowData}
        columnDefs={generatedColumnDefs}
        getRowId={(params) => getRowId(params.data)}
        defaultColDef={{
          sortable: true,
          filter: true,
          resizable: true,
          tooltipValueGetter: getTooltipContent,
        }}
        onCellValueChanged={handleCellValueChanged}
        stopEditingWhenCellsLoseFocus={true}
        gridOptions={{
          theme: theme.includes("quartz") ? themeQuartz : undefined,
          alwaysShowVerticalScroll: true,
          suppressScrollOnNewData: false,
        }}
        pagination={pagination}
        paginationPageSize={paginationPageSize}
      />
    </div>
  );
}
