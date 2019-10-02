
import React from 'react';
import Mustache from 'mustache';


const MustacheRender = ({template, context}) => {
    console.log(template, context);

    let args = ['div', null];

    let tokens = Mustache.parse(template);
    let elems = tokens.map((token) => {
        switch (token[0]) {
            case "text":  
                return token[1];
            case "&":
            case "name":
                return context[token[1]];
            default:
                return token[1];
        }
    })

    return React.createElement.apply(React, args.concat(elems));
};

export default MustacheRender;