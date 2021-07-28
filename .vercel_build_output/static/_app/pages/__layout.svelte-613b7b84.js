import{D as s,S as e,i as a,s as t,e as r,k as c,E as l,t as v,c as i,a as o,d as f,n as h,g as n,F as d,b as p,G as u,f as m,H as k,I as g,J as b,K as E,j as w,m as $,o as A,L,M as x,N as I,x as _,u as M,v as B}from"../chunks/vendor-f55b3170.js";const D={subscribe:e=>(()=>{const e=s("__svelte__");return{page:{subscribe:e.page.subscribe},navigating:{subscribe:e.navigating.subscribe},get preloading(){return console.error("stores.preloading is deprecated; use stores.navigating instead"),{subscribe:e.navigating.subscribe}},session:e.session}})().page.subscribe(e)};function H(s){let e,a,t,b,E,w,$,A,L,x,I,_,M,B,D,H,K,S,z,N,T,V,j,C,F,G,O;return{c(){e=r("header"),a=r("div"),t=r("a"),b=r("img"),w=c(),$=r("nav"),A=l("svg"),L=l("path"),x=c(),I=r("ul"),_=r("li"),M=r("a"),B=v("Home"),D=c(),H=r("li"),K=r("a"),S=v("About"),z=c(),N=r("li"),T=r("a"),V=v("Todos"),j=c(),C=l("svg"),F=l("path"),G=c(),O=r("div"),this.h()},l(s){e=i(s,"HEADER",{class:!0});var r=o(e);a=i(r,"DIV",{class:!0});var c=o(a);t=i(c,"A",{href:!0,class:!0});var l=o(t);b=i(l,"IMG",{src:!0,alt:!0,class:!0}),l.forEach(f),c.forEach(f),w=h(r),$=i(r,"NAV",{class:!0});var v=o($);A=i(v,"svg",{viewBox:!0,"aria-hidden":!0,class:!0},1);var d=o(A);L=i(d,"path",{d:!0,class:!0},1),o(L).forEach(f),d.forEach(f),x=h(v),I=i(v,"UL",{class:!0});var p=o(I);_=i(p,"LI",{class:!0});var u=o(_);M=i(u,"A",{"sveltekit:prefetch":!0,href:!0,class:!0});var m=o(M);B=n(m,"Home"),m.forEach(f),u.forEach(f),D=h(p),H=i(p,"LI",{class:!0});var k=o(H);K=i(k,"A",{"sveltekit:prefetch":!0,href:!0,class:!0});var g=o(K);S=n(g,"About"),g.forEach(f),k.forEach(f),z=h(p),N=i(p,"LI",{class:!0});var E=o(N);T=i(E,"A",{"sveltekit:prefetch":!0,href:!0,class:!0});var R=o(T);V=n(R,"Todos"),R.forEach(f),E.forEach(f),p.forEach(f),j=h(v),C=i(v,"svg",{viewBox:!0,"aria-hidden":!0,class:!0},1);var Z=o(C);F=i(Z,"path",{d:!0,class:!0},1),o(F).forEach(f),Z.forEach(f),v.forEach(f),G=h(r),O=i(r,"DIV",{class:!0}),o(O).forEach(f),r.forEach(f),this.h()},h(){d(b.src,E="/_app/assets/svelte-logo.87df40b8.svg")||p(b,"src","/_app/assets/svelte-logo.87df40b8.svg"),p(b,"alt","SvelteKit"),p(b,"class","svelte-1twf6mk"),p(t,"href","https://kit.svelte.dev"),p(t,"class","svelte-1twf6mk"),p(a,"class","corner svelte-1twf6mk"),p(L,"d","M0,0 L1,2 C1.5,3 1.5,3 2,3 L2,0 Z"),p(L,"class","svelte-1twf6mk"),p(A,"viewBox","0 0 2 3"),p(A,"aria-hidden","true"),p(A,"class","svelte-1twf6mk"),p(M,"sveltekit:prefetch",""),p(M,"href","/"),p(M,"class","svelte-1twf6mk"),p(_,"class","svelte-1twf6mk"),u(_,"active","/"===s[0].path),p(K,"sveltekit:prefetch",""),p(K,"href","/about"),p(K,"class","svelte-1twf6mk"),p(H,"class","svelte-1twf6mk"),u(H,"active","/about"===s[0].path),p(T,"sveltekit:prefetch",""),p(T,"href","/todos"),p(T,"class","svelte-1twf6mk"),p(N,"class","svelte-1twf6mk"),u(N,"active","/todos"===s[0].path),p(I,"class","svelte-1twf6mk"),p(F,"d","M0,0 L0,3 C0.5,3 0.5,3 1,2 L2,0 Z"),p(F,"class","svelte-1twf6mk"),p(C,"viewBox","0 0 2 3"),p(C,"aria-hidden","true"),p(C,"class","svelte-1twf6mk"),p($,"class","svelte-1twf6mk"),p(O,"class","corner svelte-1twf6mk"),p(e,"class","svelte-1twf6mk")},m(s,r){m(s,e,r),k(e,a),k(a,t),k(t,b),k(e,w),k(e,$),k($,A),k(A,L),k($,x),k($,I),k(I,_),k(_,M),k(M,B),k(I,D),k(I,H),k(H,K),k(K,S),k(I,z),k(I,N),k(N,T),k(T,V),k($,j),k($,C),k(C,F),k(e,G),k(e,O)},p(s,[e]){1&e&&u(_,"active","/"===s[0].path),1&e&&u(H,"active","/about"===s[0].path),1&e&&u(N,"active","/todos"===s[0].path)},i:g,o:g,d(s){s&&f(e)}}}function K(s,e,a){let t;return b(s,D,(s=>a(0,t=s))),[t]}class S extends e{constructor(s){super(),a(this,s,K,H,t,{})}}function z(s){let e,a,t,l,d,u,g,b,D,H,K;e=new S({});const z=s[1].default,N=E(z,s,s[0],null);return{c(){w(e.$$.fragment),a=c(),t=r("main"),N&&N.c(),l=c(),d=r("footer"),u=r("p"),g=v("visit "),b=r("a"),D=v("kit.svelte.dev"),H=v(" to learn SvelteKit"),this.h()},l(s){$(e.$$.fragment,s),a=h(s),t=i(s,"MAIN",{class:!0});var r=o(t);N&&N.l(r),r.forEach(f),l=h(s),d=i(s,"FOOTER",{class:!0});var c=o(d);u=i(c,"P",{});var v=o(u);g=n(v,"visit "),b=i(v,"A",{href:!0,class:!0});var p=o(b);D=n(p,"kit.svelte.dev"),p.forEach(f),H=n(v," to learn SvelteKit"),v.forEach(f),c.forEach(f),this.h()},h(){p(t,"class","svelte-1izrdc8"),p(b,"href","https://kit.svelte.dev"),p(b,"class","svelte-1izrdc8"),p(d,"class","svelte-1izrdc8")},m(s,r){A(e,s,r),m(s,a,r),m(s,t,r),N&&N.m(t,null),m(s,l,r),m(s,d,r),k(d,u),k(u,g),k(u,b),k(b,D),k(u,H),K=!0},p(s,[e]){N&&N.p&&(!K||1&e)&&L(N,z,s,s[0],K?I(z,s[0],e,null):x(s[0]),null)},i(s){K||(_(e.$$.fragment,s),_(N,s),K=!0)},o(s){M(e.$$.fragment,s),M(N,s),K=!1},d(s){B(e,s),s&&f(a),s&&f(t),N&&N.d(s),s&&f(l),s&&f(d)}}}function N(s,e,a){let{$$slots:t={},$$scope:r}=e;return s.$$set=s=>{"$$scope"in s&&a(0,r=s.$$scope)},[r,t]}class T extends e{constructor(s){super(),a(this,s,N,z,t,{})}}export{T as default};
