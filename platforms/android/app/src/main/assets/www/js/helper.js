function getFoodPics(country) {
  var photoSeachRequestUrl = 'https://api.flickr.com/services/rest/?sort=relevance&parse_tags=1&content_type=7&extras=can_comment%2Ccount_comments%2Ccount_faves%2Cdescription%2Cisfavorite%2Clicense%2Cmedia%2Cneeds_interstitial%2Cowner_name%2Cpath_alias%2Crealname%2Crotation&method=flickr.photos.search&api_key=54309a8c76a8f6c4d572eb8e247b07e9&text=' + encodeURIComponent(country) + '+food&format=json&nojsoncallback=1';

  $.ajax({
    method: 'GET',
    url: photoSeachRequestUrl,
    crossDomain: true,
  })
    .done(function (data) {
      $("#pictures").empty();
      var picsArray = data.photos.photo
      var picsIndex = 0
      var rowPics = []

      for (var k = 0; k < 3; k++) {
        //multiple rows
        var oneRowPics = []
        for (var i = 0; i < 6; i++) {
          // one row
          var farmId = picsArray[picsIndex].farm;
          var serverId = picsArray[picsIndex].server;
          var id = picsArray[picsIndex].id;
          var secret = picsArray[picsIndex].secret;
          oneRowPics.push('<div class="col-md-2" itemscope itemtype="http://schema.org/ImageObject"><img class="foodImages" itemprop="contentUrl" src="https://farm' + farmId + '.staticflickr.com/' + serverId + '/' + id + '_' + secret + '.jpg"/></div>')
          picsIndex++;
        }
        rowPics.push('<div class="row">' + oneRowPics.join('') + '</div>');
      }

      $("#pictures").append('<h1 class="display-3">Picture Section</h1>' + rowPics.join('') + '<hr>');
    })
}

function getCountries() {
  var capitalRequestUrl = "https://restcountries.eu/rest/v2/region/europe"

  var requestResult = null;
  $.ajax({
    method: 'GET',
    url: capitalRequestUrl,
    async: false,
  })
    .done(function (data) {
      requestResult = data;
    })
    .fail(function (jqXHR, textStatus, err) {
      console.log('AJAX error response:', textStatus);
    });
  return requestResult;
}

function initMap() {
  // Map options
  var options = {
    fullscreenControl: false,
    streetViewControl: false,
    scrollwheel: false,
    zoom: 5,
    center: {
      lat: 49.519325,
      lng: 13.392709,
    },
  }
  // new map
  var map = new google.maps.Map(document.getElementById('map'), options);

  // array marker
  var europeanCountries = getCountries();
  var markersArray = [];
  europeanCountries.forEach(function (countryObj) {
    markersArray.push({
      coords: {
        lat: countryObj.latlng[0],
        lng: countryObj.latlng[1],
      },
      name: countryObj.name,
      content:
        '<h1 id="markerTitle" itemprop="name">' + countryObj.name + '</h1><div itemprop="containsPlace" itemscope itemtype="http://schema.org/Place"><span itemprop="name">Capital: ' + countryObj.capital + '</span></div><span itemprop="geo" itemscope itemtype="http://schema.org/GeoCoordinates">Latitude: ' + countryObj.latlng[0] + '<br>Longitude: ' + countryObj.latlng[1] + '</span><meta itemprop="latitude" content="' + countryObj.latlng[0] + '" /><meta itemprop="longitude" content="' + countryObj.latlng[1] + '" />',
      capital: countryObj.capital,
    })
  });

  //cordova gps functionality
  function onGPSError(error) {
    console.log('code: ' + error.code + '\n' +
      'message: ' + error.message + '\n');
  }

  var onGPSSuccess = function (position) {
    var myCoords = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    }

    var myMaker = new google.maps.Marker({
      position: myCoords,
      map: map,
      icon: 'https://developers.google.com/maps/documentation/javascript/examples/full/images/beachflag.png',
    })
    var myInfoWindow = new google.maps.InfoWindow({
      content: 'I am currently here!',
    })
    myInfoWindow.open(map, myMaker);
  }

  navigator.geolocation.getCurrentPosition(onGPSSuccess, onGPSError, { enableHighAccuracy: true });

  markersArray.forEach(function (marker) {
    addMarker(marker);
  })

  var activeInfoWindow;
  //add marker function
  function addMarker(props) {
    var marker = new google.maps.Marker({
      position: props.coords,
      map: map,
    })

    if (props.content) {
      var infoWindow = new google.maps.InfoWindow({
        content: props.content,
      })
      marker.addListener('click', function () {
        if (activeInfoWindow) {
          activeInfoWindow.close();
        }
        infoWindow.open(map, marker);
        activeInfoWindow = infoWindow;
        getFoodPics(props.name);
        loadVids(props.name);
        infoWindow.open(map, marker);
        navigator.vibrate(1000);
        navigator.notification.alert(
          'Scroll down to see delicious videos and pictures of ' + props.name,  // message
          null,
          'You have chosen ' + props.name,            // title
          'Thanks!'                  // buttonName
        );
      });
    }
  }
}

function loadVids(countryName) {

  // might throw error - Error parsing header X-XSS-Protection: 1; mode=block; report=https://www.google.com/appserve/security-bugs/log/youtube: insecure reporting URL for secure page at character position 22. The default protections will be applied.
  // source: https://stackoverflow.com/questions/48714879/error-parsing-header-x-xss-protection-google-chrome

  var youtubeKey = 'AIzaSyAQXHCGZk6M41hJMHs1qqlmQ-iyuWmmQOU';
  var youtubeURL = 'https://www.googleapis.com/youtube/v3/search';

  var youtubeOptions = {
    part: 'snippet',
    key: youtubeKey,
    q: countryName + ' food',
  }

  $.getJSON(youtubeURL, youtubeOptions, function (data) {
    var videoDivContent = ''
    for (var i = 0; i < 3; i++) {
      videoDivContent = videoDivContent + `<div class="col-md-4"><div class="video-container" itemid="https://www.youtube.com/embed/${data.items[i].id.videoId}" itemscope itemtype="http://schema.org/VideoObject"><iframe width="560" height="315" src="https://www.youtube.com/embed/${data.items[i].id.videoId}" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe></div></div>`;
    }
    $('#videos').html('<h1 class="display-3">Video Section</h1><div class="row">' + videoDivContent + '</div><hr>');
  });
}
