import { parseQuery } from '@gregnr/libpg-query'
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { PostgresColumn, PostgresTable } from './types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Parses SQL into tables compatible with the existing schema visualizer.
 *
 * TODO: consider running in WebWorker
 */
export async function parseTables(sql: string) {
  // Parse SQL using the real Postgres parser (compiled to WASM)
  // See: https://github.com/pyramation/libpg-query-node/pull/34
  // TODO: add proper types for parsedSql

  const parsedSql = await parseQuery(sql)

  // TODO: add relationships and other missing table/column info
  const pgTables: PostgresTable[] = parsedSql.stmts
    .filter(({ stmt }: any) => 'CreateStmt' in stmt)
    .map(({ stmt }: any) => {
      const statement = stmt.CreateStmt

      const columns: PostgresColumn[] = statement.tableElts
        .filter((c: any) => c.ColumnDef)
        .map(({ ColumnDef }: any) => {
          const constraints = (ColumnDef.constraints || []).map((c: any) => c.Constraint.contype)

          const column: PostgresColumn = {
            name: ColumnDef.colname,
            format: ColumnDef.typeName.names.find(
              ({ String: { sval } }: any) => sval !== 'pg_catalog'
            )?.String.sval,
            id: ColumnDef.colname,
            is_nullable: !constraints.includes('CONSTR_NOTNULL'),
            is_unique: false, // TODO
            is_updatable: false, // TODO
            is_identity: constraints.includes('CONSTR_IDENTITY'),
          }

          return column
        })

      const relationships = statement.tableElts
        .filter((c: any) => c.ColumnDef)
        .filter(({ ColumnDef }: any) => {
          console.log(JSON.stringify(ColumnDef.constraints))
          return (ColumnDef.constraints || []).find(
            (c: any) => c.Constraint.contype === 'CONSTR_FOREIGN'
          )
        })
        .map(({ ColumnDef }: any) => {
          const constraint = (ColumnDef.constraints || []).find(
            (c: any) => c.Constraint.contype === 'CONSTR_FOREIGN'
          ).Constraint!
          return {
            id: `${statement.relation.relname}_${ColumnDef.colname}_${constraint.pktable.relname}_${constraint.pk_attrs[0].String.str}`,
            source_table_name: statement.relation.relname,
            source_column_name: ColumnDef.colname,
            target_table_name: constraint.pktable.relname,
            target_column_name: constraint.pk_attrs[0].String.str,
          }
        })

      const primaryKeys = statement.tableElts
        .filter((c: any) => c.ColumnDef)
        .filter(({ ColumnDef }: any) => {
          return (ColumnDef.constraints || []).find(
            (c: any) => c.Constraint.contype === 'CONSTR_PRIMARY'
          )
        })
        .map(({ ColumnDef }: any) => {
          return {
            name: ColumnDef.colname,
          }
        })
      const table: PostgresTable = {
        name: statement.relation.relname,
        columns,
        id: statement.relation.relname,
        primary_keys: primaryKeys,
        relationships: relationships,
      }

      return table
    })

  // TODO: account for relationships defined using ALTER TABLE ... ADD CONSTRAINT statements

  return pgTables
}
