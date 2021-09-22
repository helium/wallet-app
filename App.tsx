import React from 'react';
import {ApolloClient, InMemoryCache, ApolloProvider} from '@apollo/client';
import AccountInfo from './AccountInfo';

const cache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        accountActivity: {
          keyArgs: ['address'],
          merge(existing, incoming) {
            console.log({existing, incoming});
            const {cursor, data} = incoming;
            const existingData: any[] = existing?.data || [];
            const nextData = [...data, ...existingData].filter(
              (v, i, a) => a.findIndex(t => t.hash === v.hash) === i, // filter dups
            );

            return {cursor, data: nextData};
          },
        },
      },
    },
  },
});

const client = new ApolloClient({
  uri: 'http://localhost:4000/graphiql',
  cache,
});

const App = () => {
  return (
    <ApolloProvider client={client}>
      <AccountInfo />
    </ApolloProvider>
  );
};

export default App;
