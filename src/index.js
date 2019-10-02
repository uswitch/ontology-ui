import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';

import { ApolloClient } from 'apollo-client';
import { InMemoryCache, IntrospectionFragmentMatcher } from 'apollo-cache-inmemory';
import { onError } from 'apollo-link-error';
import { ApolloLink } from 'apollo-link';
import { ApolloProvider } from '@apollo/react-hooks';

import { WebSocketLink } from "apollo-link-ws";
import { SubscriptionClient } from 'subscriptions-transport-ws';

async function schema(url) {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            variables: {},
            query: `
        {
          __schema {
            types {
              kind
              name
              possibleTypes {
                name
              }
            }
          }
        }
      `,
        })
    });

    const result = await response.json();

    const filteredData = result.data.__schema.types.filter(
        type => type.possibleTypes !== null,
    );
    result.data.__schema.types = filteredData;

    return result.data
}

async function client(url, wsUrl) {
    const introspectionQueryResultData = await schema(url);

    const fragmentMatcher = new IntrospectionFragmentMatcher({
        introspectionQueryResultData
    });

    const subClient = new SubscriptionClient(wsUrl, {
        reconnect: true
    });

    return new ApolloClient({
        link: ApolloLink.from([
            onError(({ graphQLErrors, networkError }) => {
                if (graphQLErrors)
                    graphQLErrors.forEach(({ message, locations, path }) =>
                        console.log(
                            `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
                        ),
                    );
                if (networkError) console.log(`[Network error]: ${networkError}`);
            }),
            new WebSocketLink(subClient),
        ]),
        cache: new InMemoryCache({ fragmentMatcher })
    });
}

async function start() {
    const c = await(client("http://localhost:8080/graphql", "ws://localhost:8080/graphqlws"));

    ReactDOM.render(
        <ApolloProvider client={c}><App /></ApolloProvider>,
        document.getElementById('root')
    );

    // If you want your app to work offline and load faster, you can change
    // unregister() to register() below. Note this comes with some pitfalls.
    // Learn more about service workers: https://bit.ly/CRA-PWA
    serviceWorker.unregister();
}

start();
