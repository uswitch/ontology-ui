import React from 'react';
import './App.css';

import { Router, Link } from "@reach/router"

import { useQuery } from '@apollo/react-hooks';
import gql from 'graphql-tag';

import Mustache from "./Mustache.js";

const THING = gql`
query thing($id: ID){
  thing(id:$id){
    metadata{id name}
    type{metadata{id name}}
    properties

    ... on IType {
      superType{
        metadata{id name}
        type{metadata{id name}}
      }
      subTypes{
        list {
          metadata{id name}
          type{metadata{id name}}
        }
      }
      things(limit: 100) {
        list {
          metadata{id name}
          type{metadata{id name}}
        }
      }
    }

    ... on IEntity {
      sameAs: related(limit: 100, type: "/relation/v1/is_the_same_as") {
        list{
          relation{
            metadata{id}
            type{metadata{id} template}
            a{metadata{id}}
            b{metadata{id}}
          }
          entity{
            metadata{id name}
            type{metadata{id name}}
          }
        }
      }
      related: related(limit: 100) {
        list{
          relation{
            metadata{id}
            type{metadata{id} template}
            properties
            a{metadata{id}}
            b{metadata{id}}
          }
          entity{
            metadata{id name}
            type{metadata{id name}}
          }
        }
      }
    }

    ... on IRelation {
      a {
        metadata{id name}
        type{metadata{id name}}
      }
      b { 
        metadata{id name}
        type{metadata{id name}}
      }
    }
  }
}
`

const Label = ({ thing }) => {
  let name = thing.metadata.name || thing.metadata.id;
  let typeName = thing.type.metadata.name || thing.type.metadata.id;

  return <span>
    <Link to={thing.metadata.id} title={thing.metadata.id}>{name}</Link>
    [<Link to={thing.type.metadata.id} title={thing.type.metadata.id}>{typeName}</Link>]</span>
}

const Thing = (props) => {
  let id = `/${props["*"]}`;

  const { loading, error, data } = useQuery(THING, {
    variables: { id },
  });

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error :(</p>;

  let properties = JSON.parse(data.thing.properties);

  let detail = "";
  let summary = "";

  if (data.thing.related && data.thing.related.list.length > 0) {
    let related = data.thing.related.list;

    let items = related.map(({ relation, entity }) => {
      let a, b;
      let relationProps = JSON.parse(relation.properties)

      if (relation.a.metadata.id === entity.metadata.id) {
        a = <Label thing={entity} />;
        b = <Label thing={data.thing} />;
      } else {
        a = <Label thing={data.thing} />;
        b = <Label thing={entity} />;
      }

      return <li key={relation.metadata.id}>
               <Mustache context={{...relationProps,...{ a, b }}} template={relation.type.template}/>
             </li>;
    });

    detail = <details open>
      <summary>Relationships</summary>
      <ul>{items}</ul>
    </details>;

    if (data.thing.sameAs.list.length > 0) {
      summary = <div>
        same as:
        <ul>
        {data.thing.sameAs.list.map(({entity}) => { 
          return <li><Label thing={entity} /></li>
         })}
        </ul>
      </div>
    }
  }

  if (data.thing.superType || data.thing.subTypes) {
    let superType = "None.";
    if (data.thing.superType) {
      superType = <Label thing={data.thing.superType} />
    }

    let subTypes = "None.";
    if (data.thing.subTypes.list.length > 0) {
      subTypes = <ul>
        {data.thing.subTypes.list.map((typ) => {
          return <li><Label thing={typ}></Label></li>
        })}
      </ul>
    }

    let things = "None.";
    if (data.thing.things.list.length > 0) {
      things = <ul>
        {data.thing.things.list.map((thing) => {
          return <li><Label thing={thing}></Label></li>
        })}
      </ul>
    }

    detail = <div>
      <details>
      <summary>Super type</summary>
      {superType}
      </details>
      <details>
      <summary>Sub types</summary>
      {subTypes}
      </details>
      <details>
      <summary>Things</summary>
      {things}
      </details>
    </div>
  }

  if (data.thing.a || data.thing.b) {
    summary = <div>A relationship between <Label thing={data.thing.a} /> and <Label thing={data.thing.b} />.</div>
  }

  let name = data.thing.metadata.name || data.thing.metadata.id;

  return <section>
    <h1>{name}</h1>
    <p><i><Link to={data.thing.type.metadata.id}>{data.thing.type.metadata.name}</Link></i></p>
    <p>{summary}</p>
    <details open>
      <summary>Properties</summary>
      <pre>{JSON.stringify(properties, null, 2)}</pre>
    </details>
    
    {detail}
  </section>
};


function App() {
  return (
    <Router>
      <Thing path="/*" />
    </Router>
  );
}

export default App;
