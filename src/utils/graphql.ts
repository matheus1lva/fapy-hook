export type GraphQLErrorLocation = {
  line: number;
  column: number;
};

export type GraphQLError = {
  message: string;
  locations?: GraphQLErrorLocation[];
  path?: (string | number)[];
  extensions?: Record<string, unknown>;
};

export type GraphQLRequestOptions<
  TVariables extends Record<string, unknown> = Record<string, unknown>,
> = {
  url: string;
  query: string;
  variables?: TVariables;
  headers?: Record<string, string>;
  signal?: AbortSignal;
  throwOnError?: boolean;
};

export type GraphQLSuccess<TData> = {
  data: TData;
  errors?: undefined;
};

export type GraphQLFailure = {
  data?: undefined;
  errors: GraphQLError[];
};

export type GraphQLResult<TData> = GraphQLSuccess<TData> | GraphQLFailure;

export async function graphqlRequest<
  TData = unknown,
  TVariables extends Record<string, unknown> = Record<string, unknown>,
>(options: GraphQLRequestOptions<TVariables>): Promise<GraphQLResult<TData>> {
  const { url, query, variables, headers, signal, throwOnError = true } = options;

  const resp = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...(headers || {}),
    },
    body: JSON.stringify({ query, variables }),
    signal,
  });

  const text = await resp.text();

  let json: any;
  try {
    json = text ? JSON.parse(text) : {};
  } catch (e) {
    // Non-JSON response
    const err: GraphQLError = {
      message: `Invalid JSON response (${resp.status}): ${text?.slice(0, 256)}`,
    };
    if (throwOnError) throw Object.assign(new Error(err.message), { response: resp });
    return { errors: [err] };
  }

  // GraphQL spec: payload is 200 OK with possible errors[]
  if (!resp.ok) {
    const message = json?.error || json?.message || `HTTP ${resp.status}`;
    const err: GraphQLError = { message };
    if (throwOnError) throw Object.assign(new Error(message), { response: resp, body: json });
    return { errors: [err] };
  }

  if (json?.errors && json.errors.length > 0) {
    if (throwOnError) {
      const message = json.errors
        .map((e: any) => e?.message)
        .filter(Boolean)
        .join('; ');
      throw Object.assign(new Error(message || 'GraphQL error'), {
        response: resp,
        errors: json.errors,
      });
    }
    return { errors: json.errors };
  }

  return { data: json?.data as TData };
}

// Convenience: template literal tag for inline queries
export function gql(strings: TemplateStringsArray, ...expr: Array<string | number>): string {
  let result = '';
  for (let i = 0; i < strings.length; i++) {
    result += strings[i];
    if (i < expr.length) result += String(expr[i]);
  }
  return result;
}
