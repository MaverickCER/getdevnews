import { QueryResult, QueryResultRow } from "@vercel/postgres"

type TQuerySuccess = {
  data: QueryResult<QueryResultRow>,
  success: true,
}

type TFailure = {
  error: string,
  status: number,
  success: false,
}

export type TQueryResponse = TQuerySuccess | TFailure;