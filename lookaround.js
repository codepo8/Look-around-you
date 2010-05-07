YUI().use('node',function(Y){
  Y.one('body').addClass('js');
  yqlgeo.get('visitor',function(o){
    yqlgeo.getinfo(o);
  });
  yqlgeo.getinfo = function(o){
    var cur = o.place ? o.place : o;
    yqlgeo.rendermap('*', cur.centroid.latitude,cur.centroid.longitude,
                          cur.boundingBox.northEast.latitude,
                          cur.boundingBox.northEast.longitude,
                          cur.boundingBox.southWest.latitude,
                          cur.boundingBox.southWest.longitude);
    Y.one('#sights').set('innerHTML','Loading landmarks&hellip;');
    var url = 'http://ws.geonames.org/findNearbyWikipediaJSON?formatted=true'+
              '&lat=' + cur.centroid.latitude + '&lng='+
               cur.centroid.longitude+'&style=full&callback=yqlgeo.wiki';
    yqlgeo.get(url);
    Y.one('#neighbours').set('innerHTML','Loading neighbouring areas...');
    url = 'http://query.yahooapis.com/v1/public/yql?q=select%20*%20from'+
          '%20geo.places.neighbors%20where%20neighbor_woeid%3D'+
           cur.woeid+'&diagnostics=false&format=json&'+
          'callback=yqlgeo.neighbours';
    yqlgeo.get(url);
  };
  yqlgeo.get = function(url){
    Y.one('head').append('<script src="'+url+'"></script>')
  };
  yqlgeo.rendermap = function(){
   var x = arguments;
   if(x[1]){
     yqlgeo.map = new YMap(Y.one('#map')._node);
     yqlgeo.map.addTypeControl();
     yqlgeo.map.addZoomLong();
     yqlgeo.map.addPanControl();
     yqlgeo.map.disableKeyControls();
     yqlgeo.map.setMapType(YAHOO_MAP_REG);
     var points = [];
     var point = new YGeoPoint(x[1],x[2]);
     points.push(point);
     var img = new YImage();
     img.src = '16x16.png';
     img.size = new YSize(16,16);
     var newMarker = new YMarker(point,img);
     yqlgeo.map.addOverlay(newMarker);
   }
   if(x[3] && x[4]){
     point = new YGeoPoint(x[3],x[4]);
     points.push(point);
   }
   if(x[5] && x[6]){
     point = new YGeoPoint(x[5],x[6]);
     points.push(point);
   }
   var zac = yqlgeo.map.getBestZoomAndCenter(points);
   var level = points.length > 1 ? zac.zoomLevel : zac.zoomLevel + 1;
   yqlgeo.map.drawZoomAndCenter(zac.YGeoPoint,level);
   yqlgeo.map.drawZoomAndCenter(points[0],level);
  };
  yqlgeo.wiki = function(o){
    if(o.geonames){
      var out = '<ol>';
      for(var i=0;i<o.geonames.length;i++){
        var sight = o.geonames[i];
        out += '<li><h2>'+
               '<a href="http://' + sight.wikipediaUrl + '">'+
               sight.title+'</a></h2><p>';
        if(sight.thumbnailImg){
          out += '<img src="'+sight.thumbnailImg+'" alt="">';
        }
        out += sight.summary + '</p>'+
               '<p class="distance">'+sight.distance+' miles away</p>'+
               '<p class="url"><a href="http://' + sight.wikipediaUrl + '">'+
               'http://' + sight.wikipediaUrl + '</a></p>'+
               '</li>';
        var point = new YGeoPoint(sight.lat,sight.lng);
        var marker = new YMarker(point);
        marker.addLabel(i+1);
        marker.addAutoExpand(sight.title);
        yqlgeo.map.addOverlay(marker);
      }
      out += '</ol>';
    }
    Y.one('#sights').set('innerHTML',out);
  };
  yqlgeo.neighbours = function(o){
    if(!o.error && o.query.results && o.query.results.place){
      var out = '<ul><li>Around this area:<ul>';
      yqlgeo.neighbourdata = o.query.results.place;
      var all = o.query.results.place.length;
      for(var i=0;i<all;i++){
        var cur = o.query.results.place[i];
        out+='<li><a href="#n'+i+'">'+cur.name+'</a></li>';
      }
      out += '</ul></li></ul>';
      Y.one('#neighbours').set('innerHTML',out);
    } else {
      Y.one('#neighbours').remove();
    }
  };
  Y.delegate('click', function(e) {
    e.preventDefault();
    var current = Y.one(e.target).get('href').replace(/.*#n/,'');
    if(yqlgeo.neighbourdata[current]){
      yqlgeo.getinfo(yqlgeo.neighbourdata[current]);
    }
  }, '#neighbours', 'a');
  Y.delegate('click', function(e) {
    e.preventDefault();
    var dad = Y.one(e.target).ancestor('li');
    if(dad.hasClass('show')){
      dad.removeClass('show');
    } else {
      dad.addClass('show');
    }
  }, '#sights', 'h2 a');
});
