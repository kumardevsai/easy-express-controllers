# easy-express-controllers

Adds traditional MVC style controller support to Express with ES6 class, and ES-next decorators.

For example, if this class was in product.js

```javascript
import {httpGet, httpPost} from 'easy-express-controllers';

export default class Product {
    @httpGet
    getProduct({id}){
        this.send({name: 'Some Product', id: id});
    }

    @httpPost
    save({id, name, price}){
        this.send({saved: true});
    }

    //you can also override the route
    //This will use the default route, so GET product/
    //if I'd written @httpGet('all') this action would be
    //available at GET product/all
    @httpGet('') 
    allProducts(){
        this.send({products: [{id: 1, name: 'Product 1'}]})
    }
}
```

you'd now be able to 

```javascript
fetch('/product/getProduct?id=12')
    .then(resp => resp.json)
    .then(resp => console.log(resp));
```

and get back `{"name":"Some Product","id":"12"}`.  Or

```javascript
fetch('/product/save', 
    {
        method: 'post',
        body: JSON.stringify({id: 12, name: 'new name', price: 9.99})
    }
).then(resp => resp.json)
 .then(resp => console.log(resp));
```

which will return `{"saved":true}`. Or 

```javascript
fetch('/product/')
    .then(resp => resp.json)
    .then(resp => console.log(resp));
```

which will return `{"products":[{"id":1,"name":"Product 1"}]}`

Paths are also respected, so if this class is inside an admin directory

```javascript
import {httpGet, httpPost} from 'easy-express-controllers';

export default class Settings {
    //get is the default, so this decorator could have been omitted  
    @httpGet 
    getSettings({id}){
        this.send({membershipLevel: 'Pro', id: id});
    }

    @httpPost
    save({id, newMembershipLevel}){
        this.send({saved: true});
    }
}
```

then

```javascript
fetch('/admin/settings/getSettings?id=12')
    .then(resp => resp.json)
    .then(resp => console.log(resp));
```

will return `{"membershipLevel":"Pro","id":"12"}`, while 

```javascript
fetch('/admin/settings/save', 
    {
        method: 'post',
        body: JSON.stringify({id: 12, newMembershipLevel: 'Gold'})
    }
).then(resp => resp.json)
 .then(resp => console.log(resp));
```

will return  `{"saved":true}`

You can also create a more traditional REST api, like so

```javascript
import {httpGet, httpPost} from 'easy-express-controllers';

export default class RestProduct {
    get({id}){
        this.send({name: 'Some Product', id: id});
    }

    post({id, name, price}){
        this.send({updated: true});
    }

    put({id, name, price}){
        this.send({inserted: true});
    }

    delete({id}){
        this.send({deleted: true})
    }
}
```

so this, 

```javascript
fetch('/restproduct/?id=12')
    .then(resp => resp.json)
    .then(resp => console.log(resp));

fetch(
    '/restproduct', 
    { 
        method: 'post',
        body: JSON.stringify({id: 12, name: 'new val', price: 15}) 
    }
)
.then(resp => resp.json)
.then(resp => console.log(resp));

fetch('/restproduct', 
    { 
        method: 'put', 
        body: JSON.stringify({id: 12, name: 'new product', price: 9.99}) 
    }
)
.then(resp => resp.json)
.then(resp => console.log(resp));

fetch('/restproduct', 
    { 
        method: 'delete', 
        body: JSON.stringify({id: 12}) 
    }
)
.then(resp => resp.json)
.then(resp => console.log(resp));
```

will all work as expected.

---

Wiring these controllers up is simple.

```javascript
const easyControllers = require('easy-express-controllers').easyControllers;
easyControllers.createAllControllers(app, {__dirname: './node-dest', controllerPath: 'myControllers'});
```

this tells easy-express-controllers that your controller classes are in `./node-dest/myControllers`.  If you name your controllers directory `controllers` then you can leave that option off, since it's the default.

```javascript
easyControllers.createAllControllers(app, {__dirname: './node-dest'});
```

and if your (transpiled) controllers directory is at the top level, relative to where this code is being run, you can just do

```javascript
easyControllers.createAllControllers(app);
```

And of course everything is configurable.  See below for the full docs.  If you've already been using this library, note that all of the old configuration will continue to work now and going forward, even though I've simplified a few things.

# Full Docs #


## Class methods and routes ##

Each method found on your class's prototype through `Object.getOwnPropertyNames` will become a route for the path `/{your controller path}/{method name}`.  If you have a class method that you want to never be routed to, you can either define it with a symbol, so `Object.getOwnPropertyNames` misses it, or just add the `@nonRoutable` decorator.

These routes are added through Express 4's router, and the call to `app.use` is passed the controller class's path.  So if your controller was located at `books/book.js`, and had a method `details`, then the path would be `books/book/details`.  The base path of the contorller can be overridden with the `@controller` decorator, which accepts an object literal; the `path` property therein overrides this value.  For example, if this controller was located under the `controllers` directory at `publisher/publisherDetails.js`

```javascript
@controller({ path: 'publisher' })
class publisherDetails {
    details(){
        this.send({ received: true });
    }
}
```

then the path to the details method would be `/publisher/details`, as opposed to `publisher/publisherDetails/details` if this decorator were absent.

## Overriding route paths ##

If you want to override the path for a method, just pass the route to whichever verb decorator you're using.  For example

```javascript
class Thing {
    @httpGet('foo')
    bar(){

    }
}
```
will now route to `thing/foo` instead of `thing/bar`.

You can also use the `route` decorator if you'd like; the following will have the same effect.

```javascript
class Thing {
    @route('foo')
    bar(){

    }
}
```


If you'd like to set the complete path for a controller action, overriding even the base controller path, just use a leading slash.  For example

```javascript
@httpPost('/some-global-path/:userId')
about({ userId }){
}
```

now `/some-global-path/:userId` will trigger the method above, regardless of what controller it sits in, or the path thereto.

## Path verbs

Methods default to GET.  To override this, you can add one or more decorators of `@httpPost`, `@httpGet`, `@httpPut` and `@httpDelete`, or add multiple verbs at one time through `@acceptVerbs`, which accepts an array, for example `@acceptVerbs(['put', 'delete'])`.

## Setting a class-level default path verb ##

If you want your class methods to default to something other than GET, use the `defaultVerb` property on the `@controller` decorator.

```javascript
@controller({ defaultVerb: 'post' })
export default class Book {
    details(){
        this.send({ received: true });
    }
    @httpPost
    foo({ x }){
        this.send({ x });
    }
    @httpGet
    foo2({ x }){
        this.send({ x });
    }
}
```

## Handling Routes ##

Inside the controller method the following methods from the response object will be directly available through `this`: `send`, `sendFile`, `json`, `jsonp`.  The original request and response objects are also available through `this.request` and `this.response` respectively.

## Using parameters in route methods ##

Methods are passed an object with all values from `request.params`, `request.query`, and `request.body` in that order of precedence: a value from `request.params` override a matching value from `request.body`. You can either accept the object as is, or destructure what you need right in the method definition,
 as the examples above do.

**NOTE**: to ensure parameter parsing works make sure you have your middleware setup appropriately:

```javascript
var bodyParser = require('body-parser');

app.use(bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true
}));
```

## Turning an ES6 class into express paths ##

```javascript
var easyControllers = require('easy-express-controllers').easyControllers;
easyControllers.createController(app, 'person');
```
The code above will require `person.js` from under a root-level `controllers` directory.

This code gets to the root controllers directory in part with `path.dirname('.')` which is equivalent to `process.cwd()`.  This can easily be wrong depending on which directory your app was launched **from**.  If you can't, or don't want to rely on this being correct, you can pass in a third argument of an object literal.  If the object has a `__dirname` property, then that will be used in place of `path.dirname('.')`.  The object literal can *also* have a `controllerPath` property which overrides the default value of just `'controllers'`; it should be the **relative** path from the root of your application to your controllers directory, or a **relative** path from the overridden `__dirname` value you passed in, described above, to your controllers directory.

For example, if for whatever reason you're running `createController` from a module one level beneath the root, and pointing to a root level directory called `controllers2` then this code will work

```javascript
easyControllers.createController(app, 'books/foo', { __dirname: __dirname, controllerPath: '../controllers2' });
```

Or of course this would also work under the same circumstances, assuming `process.cwd` could be used.

```javascript
easyControllers.createController(app, 'books/foo', { controllerPath: 'controllers2' });
```

To have easy-express-controllers walk your directory tree and create all controllers *for you*, you can also call `createAllControllers`

```javascript
easyControllers.createAllControllers(app);
```

This sniffs out all js files at any level under your controllers directory, and calls `createController` for you.  By default, only `.js` files will be processed; if your es6 transpiled files are named with a `.es6` extension (or something else that's not `.js`) then you'll be all set.  If your ES6 files have a .js extension, then you can pass a config object as your second argumentwith a `fileTest` property specifying which files to process, like so

```javascript
easyControllers.createAllControllers(app, { fileTest: f => !/-es6\.js$/i.test(f) });
```

which of course will skip processing for all files that end in `-es6.js`.

This config object also accepts the same `__dirname` and `controllerPath` properties, discussed above.

## Setting up Babel 6 ##

Use the `babel-plugin-transform-decorators-legacy` plugin to handle decorators.  If using Gulp, your call may look like this

```javascript
.pipe(babel({ presets: ['babel-preset-es2015'], plugins: ['transform-decorators-legacy'] }))
```


