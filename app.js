var Fbefore=[],Fafter=[],geojsonLayer=null,matchingDistances=[],FiberError=[]
var CoordX,CoordY,FafterGeoJSON_Data, FbeforeGeoJSON_Data
var featureIndices = [];
var selectedFeature = null,isInFiberError=null; // Variable to keep track of the selected feature

// Select only specific properties
var selectedProperties = ['ID','Fiber Capacity', 'Placement', 'Zone', 'Service Group', 'Service Set', 'Service Area', 'Material Length', 'Slack Loop', 'Slack Loop Footage', 'Install Method', 'Layer', 'Description', 'Desc','Name','Total Length'];

// Initialize the map
var map = L.map('map', {
    maxBounds: L.latLngBounds(L.latLng(-90, -180), L.latLng(90, 180)),
    minZoom: 2,
}).setView([0, 0], 2);

var darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© Develop by AzbinFahmi',
    maxZoom: 99
});
var lightLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© Develop by AzbinFahmi',
    maxZoom: 99
});
// Add the light layer by default
lightLayer.addTo(map);

// Add a control element to toggle between dark and light themes
var baseLayers = {
    "Light Theme": lightLayer,
    "Dark Theme": darkLayer
};
L.control.layers(baseLayers).addTo(map);
try{
  sendWS()
}
catch(error){
}
//add coordinates ino viewer
var coordinatesDiv = document.getElementById('coordinates');
map.on('mousemove', function (e) {
  // Display latitude and longitude in the coordinates div
  CoordX = e.latlng.lat.toFixed(6);
  CoordY = e.latlng.lng.toFixed(6);
  coordinatesDiv.innerHTML = '<small>Latitude: ' + e.latlng.lat.toFixed(6) + ' | Longitude: ' + e.latlng.lng.toFixed(6) + '</small>';
});

// read and display first input
function handleFirstInput(event) {
    const file = event.target.files[0];  
    if (file) {
      const reader = new FileReader();
      // Read the contents of the file
      reader.onload = function (e) {
        try {
          const geojsonData = JSON.parse(e.target.result);
          FbeforeGeoJSON_Data = geojsonData
          // Extract only the selected properties for the second input
          Fbefore = geojsonData.features.map(feature => {
            const selectedObject = {};
            selectedProperties.forEach(property => {
              selectedObject[property] = feature.properties[property];
          });
            // Include coordinates
            selectedObject.coordinates = feature.geometry.coordinates;
            return selectedObject
          });

          // Add GeoJSON layer to the map
          geojsonLayer = L.geoJSON(geojsonData, {
            onEachFeature: function (feature, layer) {
              // Build popup content based on selected properties
              const popupContent = selectedProperties.map(key => {
                const propertyValue = feature.properties[key];
            
                // Check if propertyValue is null or undefined
                if (propertyValue === undefined) {
                    return null
                } else {
                    return `<b>${key}:</b> ${propertyValue}`;
                }
              }).filter(value => value !== null) // Filter out null values
              .join("<br>");
             
           
              layer.bindPopup(popupContent, {
                maxHeight: 200,
                maxWidth: 300,
                scrollWheelZoom: true
              });
            },
            
            style: function (feature) {
              // Default style for the features
              return {
                fillColor: 'blue',
                color: 'blue',
                weight: 5, // Default width
              };
            }
          }).addTo(map);
          
          
          // Fit the map bounds to the GeoJSON layer
          map.fitBounds(geojsonLayer.getBounds());
          alert("Successfully insert")
      } catch (error) {
        alert("Something went wrong")
        }
      };
  
      // Read the file as text
      reader.readAsText(file);
    }
}

//read second input
function handleSecondInput(event) {
  const file = event.target.files[0];

  if (file) {
    const reader = new FileReader();

    // Read the contents of the file
    reader.onload = function (e) {
      try {
        const selectedProperties = ['ID','Fiber Capacity', 'Placement', 'Zone', 'Service Group', 'Service Set', 'Service Area', 'Material Length', 'Slack Loop','Slack Loop Footage', 'Install Method', 'Layer', 'Description', 'Desc' ,'Name','Total Length','vetro_id'];
        const GeoJSON_Data = JSON.parse(e.target.result);
        FafterGeoJSON_Data = GeoJSON_Data

        // Extract only the selected properties for the second input
        Fafter = GeoJSON_Data.features.map(feature => {
          const selectedObject = {};
          selectedProperties.forEach(property => {
            if (feature.properties[property] !== undefined){
              selectedObject[property] = feature.properties[property];
            }
          });

          // Include coordinates
          selectedObject.coordinates = feature.geometry.coordinates;
          
          return selectedObject;
        });

        alert("Successfully insert")
      } catch (error) {
        alert("Something went wrong")
        console.error('Error parsing GeoJSON:', error);
      }
    };

    // Read the file as text
    reader.readAsText(file);
  }
}

function runQC(event){
  FiberError=[],featureIndices = []
  var selectedFiberName = document.getElementById('fiber-name').value
  if(selectedFiberName == "ID"){
    selectedProperties = ['ID','Fiber Capacity', 'Placement', 'Zone', 'Service Group', 'Service Set', 'Service Area', 'Material Length', 'Slack Loop','Slack Loop Footage' ,'Install Method', 'Layer', 'Description', 'Desc' ,'Name'];
  }
  else{
    selectedProperties = ['Fiber Capacity', 'Placement', 'Zone', 'Service Group', 'Service Set', 'Service Area', 'Material Length', 'Slack Loop', 'Slack Loop Footage' ,'Install Method', 'Layer', 'Description', 'Desc', 'Name'];
  }

  if(Fbefore.length != Fafter.length){
    alert('Error: Not Matching Total Fiber between Fiber(Before) and Fiber(After) \nTotal Fiber(Before): ' + Fbefore.length + ' \nTotal Fiber(After): ' + Fafter.length + '\n\n\n Please Recheck your Fiber(After)')
  }
  // Function to calculate distance between two points in WGS84
  function calculateDistance(point1, point2) {
    const [lon1, lat1] = point1;
    const [lon2, lat2] = point2;

    const R = 6371; // Earth radius in kilometers

    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c; // Distance in kilometers

    return distance * 1000; // Convert to meters
}

  // Function to calculate distance between the starting and ending points of two lines
  function calculateLineDistance(line1, line2) {
    const closestPointToStart = line2.reduce((closest, current) => {
      // Calculate the distance between the starting point of line1 and the current point in line2
      const distance = calculateDistance(line1[0], current);
      
      // Compare the calculated distance with the current closest distance
      return distance < closest.distance ? { point: current, distance } : closest;
  }, { point: null, distance: Infinity }).distance;
  
    const closestPointToEnd = line2.reduce((closest, current) => {
      // Calculate the distance between the ending point of line1 and the current point in line2
      // find the end of the fiber length
      for (var i=0; i < line1.length; i++){
        if (i !=0){
          dist = calculateDistance(line1[0],line1[i])
          
          if(i == 1){
            longDist = dist
            longestLengthIndex = i
          }

          if(dist > longDist){
            longestLengthIndex = i
          }

        }
        
      }
      //dalam variable current ada [lat,long]
      const distance = calculateDistance(line1[longestLengthIndex], current);
      
      // Compare the calculated distance with the current closest distance
      return distance < closest.distance ? { point: current, distance } : closest;
  }, { point: null, distance: Infinity }).distance;

  return closestPointToStart + closestPointToEnd
  }

  // Initialize an array to store the matching indices and their distances
  matchingDistances = [];
  // Initialize a set to keep track of used before indices
  const usedBeforeIndices = new Set();

  // Iterate through Fbefore
  Fbefore.forEach((beforeItem, beforeIndex) => {
    let minDistance = Infinity;
    let nearestAfterIndex = -1;

    // Iterate through Fafter
    Fafter.forEach((afterItem, afterIndex) => {
      // Check if the after index is already used
      if (!usedBeforeIndices.has(afterIndex)) {
        // Calculate the combined distance between the starting and ending coordinates of each line
        const distance = calculateLineDistance(beforeItem.coordinates, afterItem.coordinates);

        // Update the nearest line if the current distance is smaller
        if (distance < minDistance) {
          minDistance = distance;
          nearestAfterIndex = afterIndex;
        }
      }
    });

    // Check if a valid nearest index was found
    if (nearestAfterIndex !== -1 && minDistance < 1) {
      // Store the index from Fafter, the distance, and the material length
      matchingDistances.push({
        beforeIndex,
        afterIndex: nearestAfterIndex,
        distance: minDistance,
        beforeTotalLength: beforeItem['Total Length'],
        afterTotalLength: Fafter[nearestAfterIndex]['Total Length'],
      });

      // Add the after index to the used set
      usedBeforeIndices.add(nearestAfterIndex);
    }
  });

  console.log('Nearest lines in Fafter:', matchingDistances);

  const groupedInfoArray = [];
  // Iterate through matchingDistances
  matchingDistances.forEach(({ afterIndex, beforeIndex}) => {
    // Check if any of the selected properties are not equal
    const nonEqualValues = selectedProperties.filter(property => {
      const afterValue = Fafter[afterIndex][property];
      const beforeValue = Fbefore[beforeIndex][property];

      return afterValue !== beforeValue;
    });

    // If there are non-equal values, store the information in the array
    if (nonEqualValues.length > 0) {
      // Create an object with the information
      const infoObject = {
        afterIndex,
        beforeIndex,
        nonEqualValues,

      };

      // Push the information to the array
      groupedInfoArray.push(infoObject);
    }
  });
  console.log('groupedInfoArray', groupedInfoArray)
  //color the error fiber
  let currentIndex = 0;
  for (var i in groupedInfoArray){
    featureIndices.push(groupedInfoArray[i].beforeIndex)
  }
  if (geojsonLayer) {
    geojsonLayer.eachLayer(function (layer) {
      // Check if the current index is in the array of selected indices
      if (featureIndices.includes(currentIndex)) {
        FiberError.push(layer)
        // Change color for the selected features
        layer.setStyle({
          fillColor: 'red', // You can set your desired color
          color: 'red',
          weight: 5
        });    
      } else {
      }
      currentIndex++;
      
      
  });
  
  } else {
    console.log('No GeoJSON layer loaded.');
  }

  //alert
  if(featureIndices.length>0){
    alert(featureIndices.length + " Fiber error")
    console.log('FiberError',FiberError)
  }
  else{
    alert("No error")
  }
  
  //untuk color kalau click
  if (geojsonLayer) {
    geojsonLayer.eachLayer(function (layer, index) {
      const isInFiberError = FiberError.includes(layer)
      const defaultStyle = {
        fillColor: 'blue',
        color: 'blue',
        weight: 5,
      };

      layer.on({
        mouseover: function () {
          if (!isInFiberError) {
            this.setStyle({
                fillColor: 'yellow',
                color: 'yellow',
                weight: 5,
            });
          }
          else if (isInFiberError){
            this.setStyle({
              fillColor: 'orange',
              color: 'orange',
              weight: 5,
            })
          }
        },

        mouseout: function () {
          
          if(isPopupOpen){
            if(selectedFeature == this){
              
            }
            else if (!isInFiberError){
              this.setStyle(defaultStyle);
            }
            else{
              this.setStyle({
                fillColor: 'red',
                color: 'red',
                weight: 5,
              })
            }
          }
          else{
            if (!isInFiberError) {
              this.setStyle(defaultStyle);
            }
            else
            {
              this.setStyle({
                fillColor: 'red',
                color: 'red',
                weight: 5,
              })
            }
          }
        },

        click: function () {
          selectedFeature = this
          if(isPopupOpen == true){
            if (!isInFiberError) {
              this.setStyle({
                fillColor: 'yellow',
                color: 'yellow',
                weight: 5,
              });
            }

            else
            {
              this.setStyle({
                fillColor: 'orange',
                color: 'orange',
                weight: 5,
              })
            }
          }

          else{
           
          }
        }
      })
    })

    // Variable to track popup state
    var isPopupOpen = false;

    // Event listener for popup open
    map.on('popupopen', function () {
        isPopupOpen = true;
    });

    // Event listener for popup close
    map.on('popupclose', function () {
      
      isPopupOpen = false;
      if(selectedFeature){
        BooleanFiberError = FiberError.includes(selectedFeature)
        if (!BooleanFiberError) {
            selectedFeature.setStyle({
              fillColor: 'blue',
              color: 'blue',
              weight: 5,
          });
        }

        else
        {
          selectedFeature.setStyle({
            fillColor: 'red',
            color: 'red',
            weight: 5,
          })
        }
      }
    });
  }

  //untuk highlight description yang error
  var groupedInfoArray_copy = groupedInfoArray.slice();
  groupedInfoArray_copy.sort(function(a, b) {
    return a.beforeIndex - b.beforeIndex;
  });

  for (var i =0; i<FiberError.length;i++){
    selectedPropertiesOrder = ['ID','Fiber Capacity', 'Placement', 'Zone', 'Service Group', 'Service Set', 'Service Area', 'Material Length', 'Slack Loop', 'Slack Loop Footage', 'Install Method', 'Layer', 'Description', 'Desc', 'Name','Total Length'];
    const selectedFeatureLayer = FiberError[i]
    const nonEqualValues = groupedInfoArray_copy[i].nonEqualValues
    const featureProperties = selectedFeatureLayer.feature.properties;

    // Filter the selected properties based on the order
    const filteredProperties = selectedPropertiesOrder
    .map(key => {
      const value = featureProperties[key];
      const isHighlighted = nonEqualValues.includes(key);
      const highlightedValue = isHighlighted ? `<span style="color: red;">${value}</span>` : value;
      const highlightedKey = isHighlighted ? `<span style="color: red;">${key}</span>` : key;
      if (value !== undefined) {
        return `<b>${highlightedKey}</b>: ${highlightedValue}`;
      } else {
        return null;
      }
    }).filter(entry => entry !== null);
    
    // Construct the HTML content for the popup
    const modifiedPopupContent = filteredProperties.join('<br>');

    // Update the content of the popup
    selectedFeatureLayer.bindPopup(modifiedPopupContent);

  }

  //add link to link with vetro in popup box
  var index = 0
  //sort matchingDistances
  var matchingDistances_copy = matchingDistances.slice();
  matchingDistances_copy.sort(function(a, b) {
    return a.beforeIndex - b.beforeIndex;
  });

  geojsonLayer.eachLayer(function(layer) {
    let beforeIndex
    try{
      beforeIndex = matchingDistances_copy[index].afterIndex
    }
    catch(error){
      beforeIndex = null
    }
    
    if(beforeIndex != null){
      VetroID = Fafter[beforeIndex].vetro_id
      const Coord = Fafter[beforeIndex].coordinates[0]
      // Access the existing popup content
      var popupContent = layer.getPopup().getContent();

      // Add a new value, for example, a link
      link = "https://fibermap.vetro.io/map?selectedFeature="+ VetroID + "#18.52/"+ Coord[1] + "/" + Coord[0]
      var newValue = "<a href='" + link + "' target='_blank'>Go To Vetro</a>";

      // Concatenate the new value to the existing popup content
      var updatedPopupContent = newValue + "<br>" + popupContent;

      // Update the popup content
      layer.bindPopup(updatedPopupContent);
      index = index + 1
    }
    
  });

  //give ID,Name and Total of Fafter that are not match with Fbefore n then display on the map
  if(Fafter.length > Fbefore.length){
    const fafterIndicesInMatchingDistancesCopy = matchingDistances_copy.map(item => item.afterIndex);
    const fafterLength = Fafter.length;
    const missingAfterIndices = [];
    for (let i = 0; i < fafterLength; i++) {
      if (!fafterIndicesInMatchingDistancesCopy.includes(i)) {
        missingAfterIndices.push(i);
      }
    }

    WrongFiber = []
    for (i in missingAfterIndices){
      WrongFiber.push(FafterGeoJSON_Data.features[missingAfterIndices[i]])
    }
    // Display the wrong fiber in maps
    var selectedProperties = ['Fiber Capacity', 'Placement', 'Zone', 'Service Group', 'Service Set', 'Service Area', 'Material Length', 'Slack Loop', 'Slack Loop Footage', 'Install Method', 'Layer', 'Description', 'Desc', 'Name', 'Total Length'];
    L.geoJSON(WrongFiber, {
      style: function (feature) {
          return {
              color: 'purple',
              fillColor: 'purple',
              weight: 5
          };
      },
      onEachFeature: function (feature, layer) {
          // Create a popup content string with selected properties
          var popupContent = "";
          selectedProperties.forEach(function (property) {
              if (feature.properties[property] !== undefined) {
                  popupContent += "<b>" + property + ":</b> " + feature.properties[property] + "<br>";
              }
          });

          // Bind the popup to the layer
          layer.bindPopup(popupContent);
          layer.on({
              mouseover: function (e) {
                  layer.setStyle({
                      color: 'black',  
                      fillColor: 'black',
                      opacity: '0.7'
                  });
              },
              mouseout: function (e) {
                  layer.setStyle({
                      color: 'purple',
                      fillColor: 'purple'
                  });
              }
          });
      }
    }).addTo(map);

    console.log('Fiber Terlebih', WrongFiber);
  }

  else if (Fafter.length < Fbefore.length){
    const fafterIndicesInMatchingDistancesCopy = matchingDistances_copy.map(item => item.beforeIndex);
    const FbeforeLength = Fbefore.length;
    const missingAfterIndices = [];

    for (let i = 0; i < FbeforeLength; i++) {
      if (!fafterIndicesInMatchingDistancesCopy.includes(i)) {
        missingAfterIndices.push(i);
      }
    }

    let WrongFiber = []
    for (i in missingAfterIndices){
      WrongFiber.push(FbeforeGeoJSON_Data.features[missingAfterIndices[i]]) 
    }
    
    L.geoJSON(WrongFiber, {
      style: function (feature) {
          return {
              color: 'purple',
              fillColor: 'purple',
              weight: 5
          };
      },
      onEachFeature: function (feature, layer) {
          // Create a popup content string with selected properties
          var popupContent = "";
          selectedProperties.forEach(function (property) {
              if (feature.properties[property] !== undefined) {
                  popupContent += "<b>" + property + ":</b> " + feature.properties[property] + "<br>";
              }
          });

          // Bind the popup to the layer
          layer.bindPopup(popupContent);
          layer.on({
              mouseover: function (e) {
                  layer.setStyle({
                      color: 'black',  
                      fillColor: 'black',
                      opacity: '0.7'
                  });
              },
              mouseout: function (e) {
                  layer.setStyle({
                      color: 'purple',
                      fillColor: 'purple'
                  });
              }
          });
      }
    }).addTo(map);
  }
}

function AddHH(event){
  var hhLayer = L.geoJSON(null, {
    pointToLayer: function (feature, latlng) {
      return L.marker(latlng, {
          icon: L.divIcon({
              className: 'black-square-icon',
              iconSize: [10, 10], // Adjust the size of the square
              html: '<div style="background-color: black; width: 10px; height: 10px;"></div>'
          })
      });
    }
  }).addTo(map);

  var file = event.target.files[0];
  if (file) {
      var reader = new FileReader();

      reader.onload = function(e) {
          var geojsonData = JSON.parse(e.target.result);

          // Add the GeoJSON data to the map using the hhLayer
          hhLayer.addData(geojsonData);

          // Optionally, fit the map to the bounds of the GeoJSON layer
          map.fitBounds(hhLayer.getBounds());
      };

      reader.readAsText(file);
  }
}

function sendWS() {
  // Create a new WebSocket connection
  const socket = new WebSocket('wss://marshiki.ddns.net:3000');

  // Function to get the current formatted timestamp
  function getFormattedTimestamp() {
      const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      const now = new Date();
      const dayName = daysOfWeek[now.getDay()];
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are 0-based
      const year = now.getFullYear();
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const period = hours >= 12 ? 'p.m' : 'a.m';
      const formattedHours = hours % 12 || 12; // Convert to 12-hour format
      return `${dayName}-${day}-${month}-${year} - ${formattedHours}.${minutes}${period}`;
  }

  // Function to get or create a unique user ID
  function getUserId() {
      let userId = localStorage.getItem('userId');
      if (!userId) {
          userId = 'user-' + Math.random().toString(36).substr(2, 9); // Generate a unique ID
          localStorage.setItem('userId', userId);
      }
      return userId;
  }

  // Event listener for when the connection is opened
  socket.addEventListener('open', function (event) {
      // Prepare message with timestamp and unique user ID
      const timestamp = getFormattedTimestamp();
      const userId = getUserId();
      const message = `UserID: ${userId}, Platform: Fiber Self Check Tools, Timestamp: ${timestamp}`;
      socket.send(message);
      socket.close(); // Close the socket after sending the message
  });

  // Event listener for when a message is received
  socket.addEventListener('message', function (event) {
      //console.log('Received from server:', event.data);
  });

  // Event listener for when the connection is closed
  socket.addEventListener('close', function (event) {
      //console.log('WebSocket connection closed');
  });

  // Event listener for WebSocket errors
  socket.addEventListener('error', function (event) {
      console.error('WebSocket error:', event);
  });
}
// Attach event listeners to the input elements
document.getElementById('handhole').addEventListener('change', AddHH)
document.getElementById('f-before').addEventListener('change', handleFirstInput);
document.getElementById('f-after').addEventListener('change', handleSecondInput);
document.getElementById('run-QC').addEventListener('click', function(){
  if(Fbefore.length > 0 && Fafter.length > 0){
    runQC()
  }
  else{
    alert("Missing Fiber Input")
  }
});
