import{S as e,i as a,s as r,j as n,m as t,o as i,x as o,u as c,v as s,e as d,k as p,t as l,c as u,a as f,n as m,g as h,d as g,b as $,f as b,F as y,$ as v,a0 as E,r as x,w as k,a1 as S,a2 as w,a3 as P,a4 as A,G as L}from"../chunks/vendor-592b037c.js";import{k as I,c as T}from"../chunks/stitches.config-5cea04f4.js";import{E as z}from"../chunks/ErrorMessage-193814a1.js";import{r as N}from"../chunks/singletons-12a22614.js";const B=T({boxShadow:"0 0 5px 3px rgba(0, 0, 0, 0.05)",background:"rgba(0, 0, 0, 0.02)",border:"5px solid $color$white",padding:"20px",fontSize:"$fontSizes$2",lineHeight:1.5,fontWeight:600,label:{display:"block",mb:"$fontSizes$1"},"input, textarea, select":{width:"100%",padding:"0.5rem",fontSize:"$fontSizes$1",border:"1px solid $colors$black","&:focus":{outline:0,borderColor:"$color$red"}},"button, input[type='submit']":{width:"auto",background:"red",color:"white",border:0,fontSize:"$fontSizes$4",fontWeight:"600",padding:"0.5rem 1.2rem"},fieldset:{border:0,padding:0,"&[disabled]":{opacity:.5},"&::before":{height:"10px",content:"",display:"block",backgroundImage:"linear-gradient(\n                to right,\n                #ff3019 0%,\n                #e2b04a 50%,\n                #ff3019 100%\n                )"},"&[aria-busy='true']::before":{backgroundSize:"50% auto",animation:`${I({from:{backgroundPosition:"0 0"},to:{backgroundPosition:"100% 100%"}})} 0.5s linear infinite`}}}),j=async function(e,a){return N.goto(e,a,[])};function U(e){let a,r;return a=new z({props:{error:e[2].error}}),{c(){n(a.$$.fragment)},l(e){t(a.$$.fragment,e)},m(e,n){i(a,e,n),r=!0},p(e,r){const n={};4&r&&(n.error=e[2].error),a.$set(n)},i(e){r||(o(a.$$.fragment,e),r=!0)},o(e){c(a.$$.fragment,e),r=!1},d(e){s(a,e)}}}function D(e){let a,r,n,t,i,s,P,A,L,I,T,z,N,j,D,F,q,M,O,R,W,_,C,G,H,V,X=e[2].error&&U(e);return{c(){a=d("form"),X&&X.c(),r=p(),n=d("fieldset"),t=d("label"),i=l("Image\n      "),s=d("input"),P=p(),A=d("label"),L=l("Name\n      "),I=d("input"),T=p(),z=d("label"),N=l("Price\n      "),j=d("input"),D=p(),F=d("label"),q=l("Description\n      "),M=d("textarea"),O=p(),R=d("button"),W=l("+ Add Product"),this.h()},l(e){a=u(e,"FORM",{class:!0});var o=f(a);X&&X.l(o),r=m(o),n=u(o,"FIELDSET",{"aria-busy":!0});var c=f(n);t=u(c,"LABEL",{for:!0});var d=f(t);i=h(d,"Image\n      "),s=u(d,"INPUT",{type:!0,id:!0,name:!0}),d.forEach(g),P=m(c),A=u(c,"LABEL",{for:!0});var p=f(A);L=h(p,"Name\n      "),I=u(p,"INPUT",{type:!0,id:!0,name:!0,placeholder:!0}),p.forEach(g),T=m(c),z=u(c,"LABEL",{for:!0});var l=f(z);N=h(l,"Price\n      "),j=u(l,"INPUT",{type:!0,id:!0,name:!0,placeholder:!0}),l.forEach(g),D=m(c),F=u(c,"LABEL",{for:!0});var $=f(F);q=h($,"Description\n      "),M=u($,"TEXTAREA",{id:!0,name:!0,placeholder:!0}),f(M).forEach(g),$.forEach(g),O=m(c),R=u(c,"BUTTON",{type:!0});var b=f(R);W=h(b,"+ Add Product"),b.forEach(g),c.forEach(g),o.forEach(g),this.h()},h(){s.required=!0,$(s,"type","file"),$(s,"id","image"),$(s,"name","image"),$(t,"for","image"),$(I,"type","text"),$(I,"id","name"),$(I,"name","name"),$(I,"placeholder","name"),$(A,"for","name"),$(j,"type","number"),$(j,"id","price"),$(j,"name","price"),$(j,"placeholder","price"),$(z,"for","price"),$(M,"id","description"),$(M,"name","description"),$(M,"placeholder","description"),$(F,"for","description"),$(R,"type","submit"),n.disabled=_=e[2].fetching,$(n,"aria-busy",C=e[2].fetching),$(a,"class",B())},m(o,c){b(o,a,c),X&&X.m(a,null),y(a,r),y(a,n),y(n,t),y(t,i),y(t,s),y(n,P),y(n,A),y(A,L),y(A,I),v(I,e[0].name),y(n,T),y(n,z),y(z,N),y(z,j),v(j,e[0].price),y(n,D),y(n,F),y(F,q),y(F,M),v(M,e[0].description),y(n,O),y(n,R),y(R,W),G=!0,H||(V=[E(s,"change",e[4]),E(I,"input",e[5]),E(j,"input",e[6]),E(M,"input",e[7]),E(a,"submit",e[3])],H=!0)},p(e,[t]){e[2].error?X?(X.p(e,t),4&t&&o(X,1)):(X=U(e),X.c(),o(X,1),X.m(a,r)):X&&(x(),c(X,1,1,(()=>{X=null})),k()),1&t&&I.value!==e[0].name&&v(I,e[0].name),1&t&&S(j.value)!==e[0].price&&v(j,e[0].price),1&t&&v(M,e[0].description),(!G||4&t&&_!==(_=e[2].fetching))&&(n.disabled=_),(!G||4&t&&C!==(C=e[2].fetching))&&$(n,"aria-busy",C)},i(e){G||(o(X),G=!0)},o(e){c(X),G=!1},d(e){e&&g(a),X&&X.d(),H=!1,w(V)}}}function F(e,a,r){var n=this&&this.__awaiter||function(e,a,r,n){return new(r||(r=Promise))((function(t,i){function o(e){try{s(n.next(e))}catch(a){i(a)}}function c(e){try{s(n.throw(e))}catch(a){i(a)}}function s(e){var a;e.done?t(e.value):(a=e.value,a instanceof r?a:new r((function(e){e(a)}))).then(o,c)}s((n=n.apply(e,a||[])).next())}))};let t,i={name:"Nice Shoe",price:34,description:"test"},o={},c={key:1,query:P`
      mutation(
        $name: String!
        $description: String!
        $price: Int!
        $image: Upload!
      ) {
        createProduct(
          data: {
            name: $name
            description: $description
            price: $price
            status: "AVAILABLE"
            photo: { create: { image: $image, altText: $name } }
          }
        ) {
          id
          price
          description
          name
        }
      }
    `};const s=A(c);return[i,t,o,e=>n(void 0,void 0,void 0,(function*(){e.preventDefault();const{name:a,price:n,description:c}=i;console.log(t[0]),r(2,o=yield s({name:a,price:n,description:c,image:t[0]})),r(0,i={name:"",price:null,description:""}),console.log(o.data),j(`product/${o.data.createProduct.id}`)})),function(){t=this.files,r(1,t)},function(){i.name=this.value,r(0,i)},function(){i.price=S(this.value),r(0,i)},function(){i.description=this.value,r(0,i)}]}class q extends e{constructor(e){super(),a(this,e,F,D,r,{})}}function M(e){let a,r;return a=new q({}),{c(){n(a.$$.fragment)},l(e){t(a.$$.fragment,e)},m(e,n){i(a,e,n),r=!0},p:L,i(e){r||(o(a.$$.fragment,e),r=!0)},o(e){c(a.$$.fragment,e),r=!1},d(e){s(a,e)}}}class O extends e{constructor(e){super(),a(this,e,null,M,r,{})}}export{O as default};
