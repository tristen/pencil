# Pencil

**Parameters**

-   `canvas` **HTMLCanvasElement** 
-   `options` **[object]** 
    -   `options.pixelSize` **[number]** defaults to 1px
    -   `options.color` **[number]** defaults to black
-   `canvasEl`  

## clear

Erases all the pixels on the canvas

## disable

Disable drawing interaction

## enable

Enable drawing interaction

## fire

Fire an event

**Parameters**

-   `type` **String** event name.
-   `data` **Object** event data to pass to the function subscribed.

Returns **Pencil** this

## getCollection

Returns **object** an object representing the canvas's current
state. Individual pixel colors can be read via [x][y] accessors

## getPixels

Returns **object** an object representing the canvas's current
state. Individual pixel colors can be read via [x][y] accessors

## loadPixels

**Parameters**

-   `pixels` **object** A hash of pixel colors formatted as
    pixels[x][y] = color

## off

Remove an event

**Parameters**

-   `type` **String** Event name.
-   `fn` **Function** Function that should unsubscribe to the event emitted.

Returns **Pencil** this

## on

Subscribe to events

**Parameters**

-   `type` **String** name of event. Available events and the data passed into their respective event objects are:
-   `fn`  

Returns **Pencil** this;

## setColor

**Parameters**

-   `color` **string** 

## setPixelSize

**Parameters**

-   `pixelSize` **number** 
