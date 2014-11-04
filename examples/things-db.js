var uuid = require('uuid');
var _ = require('underscore');

module.exports = function createDatabase (options) {

  var baseHref = options.baseHref;

  var things = {};

  function thingAsResource(thing){
    var resource = _.extend({
      href: baseHref + thing.id
    },thing);
    delete resource.id;
    return resource;
  }

  function thingsAsCollection(){
    return Object.keys(things).map(function(id){
      return thingAsResource(things[id]);
    });
  }

  return {
    all: function(){
      return thingsAsCollection();
    },
    getThingById: function(id){
      var thing = things[id];
      return thing ? thingAsResource(thing) : thing;
    },
    deleteThingById: function(id){
      delete things[id];
    },
    createThing: function(thing){
      var newThing = _.extend({
        id: uuid()
      },thing);
      var newRef = things[newThing.id] = newThing;
      return thingAsResource(newRef);
    }
  };
};