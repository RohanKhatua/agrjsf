import { ColDef, ValueFormatterParams } from "ag-grid-community";

/**
 * Generate default column definition based on JSON schema field properties
 */
export function getDefaultColDef(
  field: string,
  schema: Record<string, any>,
  baseColDef: ColDef,
  fullSchema: Record<string, any>,
): ColDef {
  let colDef = { ...baseColDef };

  // Type-specific configurations
  switch (schema.type) {
    case "number":
    case "integer":
      colDef = {
        ...colDef,
        cellEditor: "agNumberCellEditor",
        // Add number formatting for currency if it looks like a monetary value
        ...(field.toLowerCase().includes("price") ||
        field.toLowerCase().includes("salary") ||
        field.toLowerCase().includes("cost") ||
        field.toLowerCase().includes("amount")
          ? {
              valueFormatter: (params: ValueFormatterParams) =>
                params.value ? `$${params.value.toLocaleString()}` : "",
            }
          : {}),
      };
      break;

    case "string":
      // Handle enum types (dropdowns)
      if (schema.enum && Array.isArray(schema.enum)) {
        colDef = {
          ...colDef,
          cellEditor: "agSelectCellEditor",
          cellEditorParams: {
            values: schema.enum,
          },
        };
      }
      // Handle date formats
      else if (schema.format === "date" || schema.format === "date-time") {
        colDef = {
          ...colDef,
          cellEditor: "agDateStringCellEditor",
        };
      }
      break;

    case "boolean":
      colDef = {
        ...colDef,
        cellEditor: "agCheckboxCellEditor",
        cellRenderer: "agCheckboxCellRenderer",
        suppressKeyboardEvent: (params) => params.event.key === " ", // Prevent space from scrolling
      };
      break;
  }

  // Add hidden property
  if (schema.hidden) {
    colDef.hide = true;
  }

  // Add width if specified
  if (schema.width) {
    colDef.width = schema.width;
  }

  // Check if the field is required and reflect that in the header
  const requiredFields = fullSchema.required || [];
  if (requiredFields.includes(field)) {
    colDef.headerName = `${colDef.headerName || field}*`;
  }

  return colDef;
}
