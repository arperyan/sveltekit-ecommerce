import{S as t,i as e,s as r,k as n,l as a,U as o,d as s,n as l,f as c,r as i,u as d,w as u,x as f,Z as p,H as $,_ as m,e as h,t as g,c as v,a as P,g as k,b as x,F as b,h as y,G as E,j as w,m as I,o as j,v as A,V as T}from"../../chunks/vendor-592b037c.js";import{a as _}from"../../chunks/config-c94b3b2f.js";import{E as C}from"../../chunks/ErrorMessage-193814a1.js";import{c as N}from"../../chunks/stitches.config-5cea04f4.js";import{P as R}from"../../chunks/Product-79c47321.js";const S=N({textAlign:"center",display:"inline-grid",gridTemplateColumns:"repeat(4, auto)",alignItems:"stretch",justifyContent:"center",alignContent:"center",marginBottom:"4rem",border:"1px solid $colors$lightGray",borderRadius:"10px","&:last-child":{marginTop:"4rem"},"& > *":{m:"0",px:"30px",py:"5px",borderRight:"1px solid $colors$lightGray","&:last-child":{borderRight:"0"}},"a:hover":{textDecoration:"none",color:"$colors$red"},'a[aria-disabled="true"]':{color:"$colors$grey",pointerEvents:"none"}});function D(t){let e,r,a,o,i,d,u,f,p,$,m,w,I,j,A,T,_,C,N,R;return{c(){e=h("div"),r=h("a"),a=g("Prev"),d=n(),u=h("p"),f=g("Page "),p=g(t[0]),$=g(" of "),m=g(t[3]),w=n(),I=h("p"),j=g(t[1]),A=g(" Items Total"),T=n(),_=h("a"),C=g("Next"),this.h()},l(n){e=v(n,"DIV",{class:!0});var o=P(e);r=v(o,"A",{"sveltekit:prefetch":!0,href:!0,"aria-disabled":!0});var c=P(r);a=k(c,"Prev"),c.forEach(s),d=l(o),u=v(o,"P",{});var i=P(u);f=k(i,"Page "),p=k(i,t[0]),$=k(i," of "),m=k(i,t[3]),i.forEach(s),w=l(o),I=v(o,"P",{});var h=P(I);j=k(h,t[1]),A=k(h," Items Total"),h.forEach(s),T=l(o),_=v(o,"A",{"sveltekit:prefetch":!0,href:!0,"aria-disabled":!0});var g=P(_);C=k(g,"Next"),g.forEach(s),o.forEach(s),this.h()},h(){x(r,"sveltekit:prefetch",""),x(r,"href",o="/products/"+(+t[0]-1)),x(r,"aria-disabled",i=t[0]<=1),x(_,"sveltekit:prefetch",""),x(_,"href",N="/products/"+(+t[0]+1)),x(_,"aria-disabled",R=t[0]>=t[3]),x(e,"class",S())},m(t,n){c(t,e,n),b(e,r),b(r,a),b(e,d),b(e,u),b(u,f),b(u,p),b(u,$),b(u,m),b(e,w),b(e,I),b(I,j),b(I,A),b(e,T),b(e,_),b(_,C)},p(t,e){1&e&&o!==(o="/products/"+(+t[0]-1))&&x(r,"href",o),1&e&&i!==(i=t[0]<=1)&&x(r,"aria-disabled",i),1&e&&y(p,t[0]),8&e&&y(m,t[3]),2&e&&y(j,t[1]),1&e&&N!==(N="/products/"+(+t[0]+1))&&x(_,"href",N),9&e&&R!==(R=t[0]>=t[3])&&x(_,"aria-disabled",R)},i:E,o:E,d(t){t&&s(e)}}}function U(t){let e,r;return e=new C({props:{error:t[2].error.message}}),{c(){w(e.$$.fragment)},l(t){I(e.$$.fragment,t)},m(t,n){j(e,t,n),r=!0},p(t,r){const n={};4&r&&(n.error=t[2].error.message),e.$set(n)},i(t){r||(f(e.$$.fragment,t),r=!0)},o(t){d(e.$$.fragment,t),r=!1},d(t){A(e,t)}}}function q(t){let e,r,p,$,m,h;document.title=e="\n        Sick Fits - Page "+t[0]+" of "+t[3]+"\n    ";const g=[U,D],v=[];function P(t,e){return t[2].error?0:1}return p=P(t),$=v[p]=g[p](t),{c(){r=n(),$.c(),m=a()},l(t){o('[data-svelte="svelte-4wkzgv"]',document.head).forEach(s),r=l(t),$.l(t),m=a()},m(t,e){c(t,r,e),v[p].m(t,e),c(t,m,e),h=!0},p(t,[r]){(!h||9&r)&&e!==(e="\n        Sick Fits - Page "+t[0]+" of "+t[3]+"\n    ")&&(document.title=e);let n=p;p=P(t),p===n?v[p].p(t,r):(i(),d(v[n],1,1,(()=>{v[n]=null})),u(),$=v[p],$?$.p(t,r):($=v[p]=g[p](t),$.c()),f($,1),$.m(m.parentNode,m))},i(t){h||(f($),h=!0)},o(t){d($),h=!1},d(t){t&&s(r),v[p].d(t),t&&s(m)}}}function F(t,e,r){let n,a,o;var s;let{page:l=1}=e;const c=p("\n    query PAGINATION_QUERY {\n      _allProductsMeta {\n        \n        count\n      }\n    }\n  ");return $(t,c,(t=>r(2,o=t))),m(c),t.$$set=t=>{"page"in t&&r(0,l=t.page)},t.$$.update=()=>{36&t.$$.dirty&&r(1,n=null===r(5,s=o.data)||void 0===s?void 0:s._allProductsMeta.count),2&t.$$.dirty&&r(3,a=Math.ceil(n/_))},[l,n,o,a,c,s]}class G extends t{constructor(t){super(),e(this,t,F,q,r,{page:0})}}function M(t,e,r){const n=t.slice();return n[3]=e[r],n}function O(t){var e;let r,n,a=null==(e=t[0])?void 0:e.allProducts,o=[];for(let s=0;s<a.length;s+=1)o[s]=B(M(t,a,s));const l=t=>d(o[t],1,1,(()=>{o[t]=null}));return{c(){r=h("div");for(let t=0;t<o.length;t+=1)o[t].c();this.h()},l(t){r=v(t,"DIV",{class:!0});var e=P(r);for(let r=0;r<o.length;r+=1)o[r].l(e);e.forEach(s),this.h()},h(){x(r,"class","product-list svelte-1dezbjo")},m(t,e){c(t,r,e);for(let n=0;n<o.length;n+=1)o[n].m(r,null);n=!0},p(t,e){var n;if(1&e){let s;for(a=null==(n=t[0])?void 0:n.allProducts,s=0;s<a.length;s+=1){const n=M(t,a,s);o[s]?(o[s].p(n,e),f(o[s],1)):(o[s]=B(n),o[s].c(),f(o[s],1),o[s].m(r,null))}for(i(),s=a.length;s<o.length;s+=1)l(s);u()}},i(t){if(!n){for(let t=0;t<a.length;t+=1)f(o[t]);n=!0}},o(t){o=o.filter(Boolean);for(let e=0;e<o.length;e+=1)d(o[e]);n=!1},d(t){t&&s(r),T(o,t)}}}function V(t){let e,r,n,a=t[1].message+"";return{c(){e=h("p"),r=g("Oh no... "),n=g(a)},l(t){e=v(t,"P",{});var o=P(e);r=k(o,"Oh no... "),n=k(o,a),o.forEach(s)},m(t,a){c(t,e,a),b(e,r),b(e,n)},p(t,e){2&e&&a!==(a=t[1].message+"")&&y(n,a)},i:E,o:E,d(t){t&&s(e)}}}function B(t){let e,r;return e=new R({props:{product:t[3]}}),{c(){w(e.$$.fragment)},l(t){I(e.$$.fragment,t)},m(t,n){j(e,t,n),r=!0},p(t,r){const n={};1&r&&(n.product=t[3]),e.$set(n)},i(t){r||(f(e.$$.fragment,t),r=!0)},o(t){d(e.$$.fragment,t),r=!1},d(t){A(e,t)}}}function z(t){let e,r,p,$,m;const h=[V,O],g=[];function v(t,e){return t[1]?0:1}return r=v(t),p=g[r]=h[r](t),{c(){e=n(),p.c(),$=a(),this.h()},l(t){o('[data-svelte="svelte-11dwrpn"]',document.head).forEach(s),e=l(t),p.l(t),$=a(),this.h()},h(){document.title="Sick Fits"},m(t,n){c(t,e,n),g[r].m(t,n),c(t,$,n),m=!0},p(t,[e]){let n=r;r=v(t),r===n?g[r].p(t,e):(i(),d(g[n],1,1,(()=>{g[n]=null})),u(),p=g[r],p?p.p(t,e):(p=g[r]=h[r](t),p.c()),f(p,1),p.m($.parentNode,$))},i(t){m||(f(p),m=!0)},o(t){d(p),m=!1},d(t){t&&s(e),g[r].d(t),t&&s($)}}}function L(t,e,r){let n,a,{allProduct:o}=e;return t.$$set=t=>{"allProduct"in t&&r(2,o=t.allProduct)},t.$$.update=()=>{4&t.$$.dirty&&r(0,({data:n,error:a}=o),n,(r(1,a),r(2,o))),1&t.$$.dirty&&console.log(n)},[n,a,o]}class Q extends t{constructor(t){super(),e(this,t,L,z,r,{allProduct:2})}}function Y(t){let e,r,a,o,i,u,p;return r=new G({props:{page:t[0]||1}}),o=new Q({props:{allProduct:t[1]}}),u=new G({props:{page:t[0]||1}}),{c(){e=h("div"),w(r.$$.fragment),a=n(),w(o.$$.fragment),i=n(),w(u.$$.fragment)},l(t){e=v(t,"DIV",{});var n=P(e);I(r.$$.fragment,n),a=l(n),I(o.$$.fragment,n),i=l(n),I(u.$$.fragment,n),n.forEach(s)},m(t,n){c(t,e,n),j(r,e,null),b(e,a),j(o,e,null),b(e,i),j(u,e,null),p=!0},p(t,[e]){const n={};1&e&&(n.page=t[0]||1),r.$set(n);const a={};2&e&&(a.allProduct=t[1]),o.$set(a);const s={};1&e&&(s.page=t[0]||1),u.$set(s)},i(t){p||(f(r.$$.fragment,t),f(o.$$.fragment,t),f(u.$$.fragment,t),p=!0)},o(t){d(r.$$.fragment,t),d(o.$$.fragment,t),d(u.$$.fragment,t),p=!1},d(t){t&&s(e),A(r),A(o),A(u)}}}const H=async({page:t,context:e})=>{let{id:r}=t.params,{client:n}=e;console.log("Conetxt",{context:e,id:r});let a=await n.query("\n               query ALL_PRODUCTS_QUERY($skip: Int = 0, $first: Int) {\n                    allProducts(first: $first, skip: $skip, sortBy: [name_ASC]) {\n                        id\n                        name\n                        description\n                        photo {\n                            id\n                            image {\n                                id\n                                publicUrlTransformed\n                                }\n                            }\n                            price\n                        }\n                    }",{skip:4*r-4,first:4},{requestPolicy:"network-only"}).toPromise();return console.log(a),{props:{id:r,allProduct:a}}};function Z(t,e,r){let{id:n}=e,{allProduct:a}=e;return t.$$set=t=>{"id"in t&&r(0,n=t.id),"allProduct"in t&&r(1,a=t.allProduct)},[n,a]}class J extends t{constructor(t){super(),e(this,t,Z,Y,r,{id:0,allProduct:1})}}export{J as default,H as load};
