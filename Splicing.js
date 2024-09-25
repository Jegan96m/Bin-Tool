let workbook_arr = {}, FileName=[], cableInfo ={}, HH_Before =[], HH_After =[], HHlayer =[]
checkError ={'Equipment':[],'Splicing':[]}, HH_coordinate =[],eqFromCableSheet = {}, duplicateHH = []

function handleZipFile_before() {
  function cleanFileName(fileName) {
    const prefixToRemove = 'Splice_Report_';
    const suffixToRemove = '.xlsx';
  
    if (fileName.startsWith(prefixToRemove) && fileName.endsWith(suffixToRemove)) {
      // Remove the prefix and suffix
      return fileName.slice(prefixToRemove.length, -suffixToRemove.length);
    } else {
      // If the file name doesn't match the expected format, return it unchanged
      return fileName;
    }
  }
  const zipFileInput = document.getElementById('zipFileInput_before');
  const zipFile = zipFileInput.files[0];

  if (zipFile) {
    const reader = new FileReader();

    reader.onload = function (event) {
      const zipData = event.target.result;

      JSZip.loadAsync(zipData)
        .then(function (zip) {
          const xlsxFiles = [];
          
          // Iterate through all files in the zip
          zip.forEach(function (relativePath, zipEntry) {
            FileName.push(cleanFileName(zipEntry.name))
            if (zipEntry.name.endsWith('.xlsx')) {
              // Collect all xlsx files
              xlsxFiles.push(zipEntry.async('uint8array'));
            }
          });
          if (xlsxFiles.length === 0) {
            throw new Error('No xlsx files found in the zip');
          }

          // Process all xlsx files concurrently
          return Promise.all(xlsxFiles);
        })
        .then(function (xlsxDataArray) {
          let index = 0
          xlsxDataArray.forEach(function (xlsxData) {
            const workbook = XLSX.read(xlsxData, { type: 'array' });
            //workbook_arr.push({[FileName[index]]: workbook})
            workbook_arr[FileName[index]] = workbook
            index = index + 1
          });
          HH_Before = StoreSplicingInfo()
          console.log('HH_Before',HH_Before)
          AddHHintoMap()

          //console.log('HHlayer',HHlayer)
        })
        .catch(function (error) {
          console.error('Error reading zip file:', error);
        });
    };
    reader.readAsArrayBuffer(zipFile);
  }
}

function handleZipFile_after() {
  function cleanFileName(fileName) {
    const prefixToRemove = 'Splice_Report_';
    const suffixToRemove = '.xlsx';
  
    if (fileName.startsWith(prefixToRemove) && fileName.endsWith(suffixToRemove)) {
      // Remove the prefix and suffix
      return fileName.slice(prefixToRemove.length, -suffixToRemove.length);
    } else {
      // If the file name doesn't match the expected format, return it unchanged
      return fileName;
    }
  }
  const zipFileInput = document.getElementById('zipFileInput_after');
  const zipFile = zipFileInput.files[0];

  if (zipFile) {
    const reader = new FileReader();

    reader.onload = function (event) {
      const zipData = event.target.result;

      JSZip.loadAsync(zipData)
        .then(function (zip) {
          const xlsxFiles = [];
          
          // Iterate through all files in the zip
          zip.forEach(function (relativePath, zipEntry) {
            FileName.push(cleanFileName(zipEntry.name))
            if (zipEntry.name.endsWith('.xlsx')) {
              // Collect all xlsx files
              xlsxFiles.push(zipEntry.async('uint8array'));
            }
          });
          if (xlsxFiles.length === 0) {
            throw new Error('No xlsx files found in the zip');
          }

          // Process all xlsx files concurrently
          return Promise.all(xlsxFiles);
        })
        .then(function (xlsxDataArray) {
          let index = 0
          xlsxDataArray.forEach(function (xlsxData) {
            const workbook = XLSX.read(xlsxData, { type: 'array' });
            //workbook_arr.push({[FileName[index]]: workbook})
            workbook_arr[FileName[index]] = workbook
            index = index + 1
          });
          HH_After = StoreSplicingInfo()
          console.log('HH_After',HH_After)
          checkError = CompareSplicing()
          HighlightWrongHH(checkError)

        })
        .catch(function (error) {
          console.error('Error reading zip file:', error);
        });
    };
    reader.readAsArrayBuffer(zipFile);
  }
}

//Read and store Splicing Information
function StoreSplicingInfo(){
  // Function to extract latitude and longitude from the cellValue
  function extractCoordinates(cellValue) {
    const match = cellValue.match(/Lat: ([\d.-]+) Lon: ([\d.-]+)/);
    if (match) {
        return [parseFloat(match[1]), parseFloat(match[2])];
    }
    return null; // Return null if no match is found
}
  function CheckCableAttach(arr){
    if(arr.includes("Equipment")){
      return arr.length -1
    }
    else{
      return arr.length
    }
  }
  //simplified splice info
  function simplifiedSplicing(arr){
    let findIndex = [0]
    for(let i =1; i< arr.length; i++){
      if(Number(arr[i][0]) != Number(arr[i-1][0]) + 1){
        if(!findIndex.includes(i)){
          findIndex.push(i)
        }
      }

      if(Number(arr[i][1]) != Number(arr[i-1][1]) + 1){
        if(!findIndex.includes(i)){
          findIndex.push(i)
        }
      }

      if(arr[i][2] != arr[i-1][2]){
        if(!findIndex.includes(i)){
          findIndex.push(i)
        }
      }
    }

    if(findIndex[findIndex.length] != arr.length){
      findIndex.push(arr.length)
    }

    let result =[]
    for(let i = 1; i < findIndex.length; i++){
      let temp_result = []

      if(findIndex[i] - findIndex[i-1] == 1){
        if(arr[findIndex[i-1]].length == 2){
          temp_result = [arr[findIndex[i-1]][0], '', arr[findIndex[i-1]][1]]
        }
        else{
          temp_result = arr[findIndex[i-1]]
        }
        
      }

      else{
        temp_result = [`${arr[findIndex[i-1]][0]}-${arr[findIndex[i] - 1][0]}`, 
        `${arr[findIndex[i-1]][1]}-${arr[findIndex[i] - 1][1]}`, arr[findIndex[i - 1]][2]]
      }
      result.push(temp_result)
    }
    
    return result
  }
  //simplified equipment data
  function simplifiedEquipment(arr){
    let findIndex = [0]
    //console.log('arr: ',arr)
    for(let i =1; i< arr.length; i++){

      if(arr[i][0] != arr[i-1][0]){
        if(!findIndex.includes(i)){
          findIndex.push(i)
        }
      }

      if(Number(arr[i][1]) != Number(arr[i-1][1]) + 1){
        if(!findIndex.includes(i)){
          findIndex.push(i)
        }
      }

      if(Number(arr[i][2]) != Number(arr[i-1][2]) + 1){
        if(!findIndex.includes(i)){
          findIndex.push(i)
        }
      }

      if(arr[i][3] != arr[i-1][3]){
        if(!findIndex.includes(i)){
          findIndex.push(i)
        }
      }
    }

    if(findIndex[findIndex.length] != arr.length){
      findIndex.push(arr.length)
    }

    let result =[]
    for(let i = 1; i < findIndex.length; i++){
      let temp_result = []

      if(findIndex[i] - findIndex[i-1] == 1){
        temp_result = arr[findIndex[i-1]]
        result.push(temp_result)
      }

      else{
        try{
          temp_result = [arr[findIndex[i - 1]][0], `${arr[findIndex[i-1]][1]}-${arr[findIndex[i] - 1][1]}`,
        `${arr[findIndex[i-1]][2]}-${arr[findIndex[i] - 1][2]}`, arr[findIndex[i - 1]][3]]
        result.push(temp_result)
        }
        catch(error){
          temp_result = null
        }
        
      }     
    }
    
    return result
  }
  //find which column based on name and row given
  function readWhichColumn(startColumn,lastColumn, value, row, sheet){
    let startCode = startColumn.charCodeAt(0)
    let endCode = lastColumn.charCodeAt(0)

    for (let code = startCode; code <= endCode; code++) {
      let currentLetter = String.fromCharCode(code);
      let currentValue = sheet[`${currentLetter}${row}`].v

      if(currentValue == value){
        return currentLetter
      }
    }

  }
  //use in Info keys untuk ambik fiber tu ke HH mana
  function extractValueBetweenToAndComma(input) {
    const startIndex = input.indexOf('to') + 3; // Adding 3 to skip 'to' and the following space
    const endIndex = input.indexOf(',', startIndex);
    const result = input.substring(startIndex, endIndex).trim();
    return result;
  }
  //get direction
  function getDirectionFromString(str) {
    let words = str.split(' ');
    let direction = words[0];

    // Check if the first word is a direction
    if (['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'].includes(direction)) {
        return direction;
    } else {
        return ;
    }
  }
  //geet cableout name based on keyword(A,B,C,D)
  function getCableOutfromInfo(HHname,keyword){
    let arr = cableInfo[HHname]['Info'][keyword]
    if(keyword == ''){
      return ''
    }
    return `${arr[0]}_to_${arr[4]}`
  }
  function extractNameFromPath(path) {
    // Split the path by '/'
    let parts = path.split('/');
    
    // Get the last part of the path
    let fileName = parts[parts.length - 1];
    
    // Check if the last part contains a dot (.)
    if (fileName.includes('.')) {
        // If yes, consider the part before the last dot as the file name
        return fileName.slice(0, fileName.lastIndexOf('.'));
    } else {
        // Otherwise, treat it as a directory and return the last part (file name)
        return parts[parts.length - 1];
    }
  }

  let cableInfo ={}, checkHHname = [], nameHH = 1, duplicateHH = []
  for (let key in workbook_arr) {
    let coord =[]
    if (workbook_arr.hasOwnProperty(key)) {
      const workbook = workbook_arr[key];
      let key_name = extractNameFromPath(key)
      key_name = key_name.replace(/_[0-9]+$/, '').split('_')
      key = key.replace(/_[0-9]+$/, '')
      key = key_name[key_name.length-1].replace(/_[0-9]+$/, '')
      if(!checkHHname.includes(key)){
        checkHHname.push(key)
      }
      else{
        duplicateHH.push(key)
        key = `${key}_${nameHH}`
        //duplicateHH.push(key)
        nameHH+=1
      }
      const totalCable = CheckCableAttach(workbook.SheetNames)
      workbook.SheetNames.forEach(sheetName => {
        if(sheetName.includes('DR-') || sheetName.includes('Drop')){
          //do nothing or skip drop file
        }
        else if(sheetName != "Equipment"){
          let tempCable=[]
          let tempSpliceInfo_arr =[], storeEQ_arr = []
          const sheet = workbook.Sheets[sheetName];
          const maxrow = sheet['!ref'].match(/(\d+)$/)[1]
          //cari Info dekat table info
          for(var cellref in sheet){
            if( cellref.match(/([A-Z]+)(\d+)/) != null){
              const cellColumn = cellref.match(/([A-Z]+)(\d+)/)[1]
              const cellRow = cellref.match(/([A-Z]+)(\d+)/)[2]
              const cellValue = sheet[cellref].v
              if (cellColumn == "A" && cellValue === 'Cable'){
                for(let rowIndex = Number(cellRow) + 1; rowIndex <= (Number(cellRow) + totalCable); rowIndex++){
                  //Column A,C,E,F A for A = cable, C = ID, E = Count, F = Direction to
                  tempCable.push({
                    [sheet[`A${rowIndex}`].v] : [sheet[`C${rowIndex}`].v, sheet[`E${rowIndex}`].v, sheet[`F${rowIndex}`].v, 
                    getDirectionFromString(sheet[`F${rowIndex}`].v), extractValueBetweenToAndComma(sheet[`F${rowIndex}`].v)]
                  })
                }
              }

              if( coord.length == 0 && HH_Before.length == 0){
                if ((cellValue.includes("Lat") && cellValue.includes("Lon"))
                  || (cellValue.includes("Lat") || cellValue.includes("Lon"))){

                  if(cellValue.includes("Lat") && cellValue.includes("Lon")){
                    coord = extractCoordinates(cellValue)
                    HH_coordinate.push([key,coord[0],coord[1],''])
                  }

                  else if (cellValue.includes("Lat:")){
                    cellLat = cellValue.split('Lat:')[1]
                  }

                  else if (cellValue.includes("Lon:")){
                    let cellLon = cellValue.split('Lon:')[1]
                    HH_coordinate.push([key,cellLat,cellLon,''])
                    coord = [cellLat,cellLon]
                  }
                }
              }
              
            }
          }
          if (tempCable.length > 0){
            const result = tempCable.reduce((acc, obj) => {
              const key = Object.keys(obj)[0]; // Assuming each object has only one key
              acc[key] = obj[key];
              return acc;
            }, {});

            if (!cableInfo[key]) {
              if(totalCable == workbook.SheetNames){
                cableInfo[key] = { 'Info': {}, 'SpliceInfo': {}, 'coordinates': []};
                eqFromCableSheet[key] = { 'EqInfo':{}, 'EqInfo_Edited':{}}
              }
              else{
                cableInfo[key] = { 'Info': {}, 'SpliceInfo': {}, 'Equipment': {}, 'coordinates': []};
                eqFromCableSheet[key] = { 'EqInfo':{}, 'EqInfo_Edited':{}}
              }
              
            }
            Object.assign(cableInfo[key]['Info'], result);
            cableInfo[key]['coordinates'] = coord
            //cableInfo[key] = {'Info': result}
          }

          //pick fiber splicing
          let newCableName
          for(var cellref in sheet){
            if( cellref.match(/([A-Z]+)(\d+)/) != null){
              const cellColumn = cellref.match(/([A-Z]+)(\d+)/)[1]
              const cellRow = cellref.match(/([A-Z]+)(\d+)/)[2]
              const cellValue = sheet[cellref].v
              let lettersArray = sheet['!ref'].match(/[A-Za-z]+/g);
              let lastColumn = lettersArray[lettersArray.length - 1][0];
              
              if (cellValue === 'Fiber #'){
                const colFiber = cellColumn //Fiber # symbol
                const colEquipment = readWhichColumn(cellColumn,lastColumn,'Equipment', cellRow, sheet) //Equipment
                const colPort = readWhichColumn(cellColumn,lastColumn,'Port', cellRow, sheet) // Port
                const colCable = readWhichColumn(cellColumn,lastColumn,'Cable', cellRow, sheet) //cable
                const colF = readWhichColumn(cellColumn,lastColumn,'#', cellRow, sheet) //# symbol
                const colNotes = readWhichColumn(cellColumn,lastColumn,'Notes', cellRow, sheet)

                let startCode = cellColumn.charCodeAt(0) - 1
                let currentLetter = String.fromCharCode(startCode);
                let currentcableName = sheet[`${currentLetter}${Number(cellRow)-1}`].v.split(" ")[1]
                newCableName = `${cableInfo[key]['Info'][currentcableName][0]}_to_${cableInfo[key]['Info'][currentcableName][4]}`
                //pick fiber info from splicing row
                let eqName, fiber_IN
                for(let rowIndex = Number(cellRow) + 1; rowIndex <= maxrow; rowIndex++){
                  let tempSpliceInfo=[], storeEQ = []
                  const fiberVal = sheet[`${colFiber}${rowIndex}`].v
                  const eqVal = sheet[`${colEquipment}${rowIndex}`].v
                  const portVal =  sheet[`${colPort}${rowIndex}`].v
                  const cableVal = sheet[`${colCable}${rowIndex}`].v
                  const fVal = sheet[`${colF}${rowIndex}`].v
                  const notesVal = sheet[`${colNotes}${rowIndex}`].v

                  //first check ada equipment punya value dak
                  if(eqVal == "" && portVal == ""){
                    tempSpliceInfo.push(fiberVal)
                    if(notesVal === "Cut" || notesVal === "Passthrough"){
                      if(notesVal === "Passthrough"){
                        let cable =  getCableOutfromInfo(key,cableVal)
                        tempSpliceInfo.push(cable,notesVal)
                      }
                      else{
                        tempSpliceInfo.push(notesVal)
                      }
                    }
                    else{
                      let cable =  getCableOutfromInfo(key,cableVal)
                      tempSpliceInfo.push(fVal,cable)
                    }
                  }
                  else{
                    if(eqVal != "" && portVal != ""){
                      eqName = eqVal.replace(/[^a-zA-Z0-9]/g, '')
                      fiber_IN = fiberVal
                    }
                    let check_cable = getCableOutfromInfo(key,cableVal)
                    if(eqVal != "" && (cableVal == "" || check_cable.includes('DR-') || check_cable.includes('Drop') )){
                      storeEQ.push(fiberVal, eqName)
                    }
                    else {
                      if(!check_cable.includes('DR-') || check_cable.includes('Drop')){
                        storeEQ.push(fiber_IN , eqName, portVal, fVal, getCableOutfromInfo(key,cableVal))
                      }                    
                    }
                    //continue
                  }
                  if(tempSpliceInfo.length>0){
                    tempSpliceInfo_arr.push(tempSpliceInfo.flat())
                  }
                  if(storeEQ.length > 0){
                    storeEQ_arr.push(storeEQ.flat())
                  }
                }
              }
            }
          }

          let dictSpliceInfo ={}, EqInfo = {}
          dictSpliceInfo[newCableName] = tempSpliceInfo_arr
          EqInfo[newCableName] = storeEQ_arr
          
          // Merge the new SpliceInfo values with existing ones
          Object.assign(cableInfo[key]['SpliceInfo'], dictSpliceInfo);
          Object.assign(eqFromCableSheet[key]['EqInfo'], EqInfo);
        }

        else if(sheetName == "Equipment"){
          let Eqconnect
          const sheet = workbook.Sheets[sheetName];
          const maxrow = sheet['!ref'].match(/(\d+)$/)[1]
          let inputName, Eqconnect_arr =[], fiberInput
          //Equipment Connections.
          for(var cellref in sheet){
            if(cellref.match(/([A-Z]+)(\d+)/) != null){
              const cellColumn = cellref.match(/([A-Z]+)(\d+)/)[1]
              const cellRow = cellref.match(/([A-Z]+)(\d+)/)[2]
              const cellValue = sheet[cellref].v
              let lettersArray = sheet['!ref'].match(/[A-Za-z]+/g);
              let lastColumn = lettersArray[lettersArray.length - 1][0];
              
              if (cellValue === 'Input'){
                const colInput =  cellColumn //Input
                const colFIn = readWhichColumn(cellColumn,lastColumn,'#', cellRow, sheet) //#
                const colEq= readWhichColumn(cellColumn,lastColumn,'Equipment', cellRow, sheet) //Equipment
                const colPort = readWhichColumn(cellColumn,lastColumn,'Port', cellRow, sheet) // port
                const colF = readWhichColumn(colPort,lastColumn,'#', cellRow, sheet) //# (located after Port) Output
                const colFOut = readWhichColumn(colPort,lastColumn,'Output', cellRow, sheet) //Output

                for(let rowIndex = Number(cellRow) + 1; rowIndex <= maxrow; rowIndex++){
                  Eqconnect =[]
                  try{
                    var inputVal = sheet[`${colInput}${rowIndex}`].v
                    var fInVal = sheet[`${colFIn}${rowIndex}`].v
                    var eqVal =  sheet[`${colEq}${rowIndex}`].v
                    var portVal = sheet[`${colPort}${rowIndex}`].v
                    var fVal = sheet[`${colF}${rowIndex}`].v
                    var fOutVal = sheet[`${colFOut}${rowIndex}`].v
                  }
                  catch(error){
                    inputVal = ""
                    fOutVal =""
                  }
                  //ni Secondary Splitter kalau dia no output
                  if(fOutVal.includes('DR-') || fOutVal.includes('Drop')){
                    fOutVal = ""
                  }

                  if(fOutVal == ""){
                    if(inputVal != ""){
                      Eqconnect.push(inputVal,fInVal,eqVal.replace(/[^a-zA-Z0-9]/g, ''))
                    }
                  }
                  //ni untuk primary
                  else if(fOutVal != ""){
                    if(inputVal != ""){
                      inputName = inputVal
                      fiberInput = fInVal
                    }
                    Eqconnect.push(inputName,fiberInput,eqVal.replace(/[^a-zA-Z0-9]/g, ''),portVal,fVal,fOutVal)      
                  }
                  if(Eqconnect.length>0){
                    Eqconnect_arr.push(Eqconnect.flat())
                  }
                }
              }
            }
          }
          if(Eqconnect_arr.length>0){
            // Merge the new SpliceInfo values with existing ones
            Object.assign(cableInfo[key]['Equipment'], Eqconnect_arr);
          }
        }
      });
    }
  }
  //console.log('eqFromCableSheet: ',eqFromCableSheet)
  //manipulate and organize the data
  let organizedEq, uniqueName, uniqueFiberIn
  for (let HH in cableInfo){
    uniqueName =[], uniqueFiberIn = []
    for(let infos in cableInfo[HH]){
      if(infos == "Equipment"){
        eqArr =  cableInfo[HH][infos]
        //get unique name and unique fiber In
        for(let index in eqArr){
          let name = eqArr[index][0]
          let fiberIn = Number(eqArr[index][1])
          //console.log('name',name)
          if(name != undefined){
            if(!uniqueName.includes(name)){
              if(!name.includes("◀")){
                uniqueName.push(name)
              }
            }
          }
            //get unique fiber in 
          if(!uniqueFiberIn.includes(fiberIn)){
            if(fiberIn != 0){
              uniqueFiberIn.push(fiberIn)
            }
          }
        }
        //create object keys
        organizedEq ={}
        for(let i =0; i< uniqueName.length; i++){
          //insert same cable as keys
          let arr_eq =[]
          for(let index in eqArr){
            if(uniqueName[i] === eqArr[index][0]){
              arr_eq.push(eqArr[index].slice(1))
            }
            organizedEq[uniqueName[i]] = arr_eq
          }
          //insert same fiber as keys
          let arr_fiberIn ={}
          for(let k = 0; k < uniqueFiberIn.length; k++){
            for(let fiberName in organizedEq){
              arr_ = []
              for (let j = 0; j < organizedEq[fiberName].length; j++){
                if(Number(uniqueFiberIn[k]) == Number(organizedEq[fiberName][j][0])){
                  arr_.push(organizedEq[fiberName][j].slice(1))
                }
              }
              if(arr_.length != 0){
                arr_fiberIn[uniqueFiberIn[k]] = arr_
              }
            }
          }
          organizedEq[uniqueName[i]] = arr_fiberIn
          if(!cableInfo[HH][infos][uniqueName[i]]){            
            cableInfo[HH][infos] = organizedEq
          }
        }
      }   
    }
  }
  //reorganize the splice and equipment info (ada nak guna satgi)
  for(let HH in cableInfo){
    passthrough_cable =[]
    for(let sub_name in cableInfo[HH]['SpliceInfo']){
      Passthrough = {}
      arrOfSplice = cableInfo[HH]['SpliceInfo'][sub_name]
      if(arrOfSplice.length != 0){
        cableInfo[HH]['SpliceInfo'][sub_name] = simplifiedSplicing(arrOfSplice)
      }
      else{
        //console.log('HH: ',HH)
        //console.log("cableInfo[HH]['SpliceInfo']: ",cableInfo[HH]['SpliceInfo'])
        //console.log("cableInfo[HH]['Equipment']: ",cableInfo[HH]['Equipment'])
      }
    }
    for(let FiberName in cableInfo[HH]['Equipment']){
      for(let fNumber in cableInfo[HH]['Equipment'][FiberName]){
        arrOfEquipment = cableInfo[HH]['Equipment'][FiberName][fNumber]
        if(Array.isArray(arrOfEquipment) && arrOfEquipment.every(item => Array.isArray(item))){
          if(arrOfEquipment.length != 0){
            let result = simplifiedEquipment(arrOfEquipment)
            cableInfo[HH]['Equipment'][FiberName][fNumber] = result
          }
        }
      }
    }

    //create passthrough keys
    for(let sub_name in cableInfo[HH]['SpliceInfo']){
      arrOfSplice = cableInfo[HH]['SpliceInfo'][sub_name]
      for(let i =0; i < arrOfSplice.length; i++){
        cableInfo[HH]['Passthrough'] = [] //initialize passthrough keys into object
        if(arrOfSplice[i].includes("Passthrough")){
          //passthrough_cable = [sub_name, arrOfSplice[i][1]]
          if(!passthrough_cable.includes(sub_name)){
            passthrough_cable.push(sub_name)
          }
        }
      }
    }
    if(passthrough_cable.length>0){
      cableInfo[HH]['Passthrough'] = passthrough_cable
    }
  }
  //reorganize eqFromCableSheet
  for(let HH in eqFromCableSheet){
    arr = eqFromCableSheet[HH]['EqInfo']
    for(let name in arr){
      const dict = {};
      arr[name].forEach(arrs => {
        const key = arrs[0];
        if (!dict[key]) {
          dict[key] = [];
        }
        dict[key].push(arrs.slice(1));
      });
      let new_dict = {}
      for(let fiberin in dict){
        let arr_ = dict[fiberin]
        let result = simplifiedEquipment(arr_)
        new_dict[fiberin] = result
      }
      eqFromCableSheet[HH]['EqInfo_Edited'][name] = new_dict
    }
  }
  //compare cableinfo and eqFromCableSheet
  for(let HH in cableInfo){
    // console.log(HH)
    for(let cablename in cableInfo[HH]['Equipment']){
      let arr1 = cableInfo[HH]['Equipment'][cablename], newFibername,newFibername_old
      for(let fiberin in arr1){
        for(let cablename1 in eqFromCableSheet[HH]['EqInfo_Edited']){
          let name = cablename1.split('_to_')
          let arr2 = eqFromCableSheet[HH]['EqInfo_Edited'][cablename1]
          for(let fiberin2 in arr2){
            if(fiberin2 === fiberin && name[0]==cablename){
              newFibername = cablename1
              for(let i = 0; i < arr1[fiberin].length; i++){
                if(arr2[fiberin2][i] != undefined){
                  if(arr2[fiberin2][i][3] != '' && arr2[fiberin2][i].length == 4 ){
                    if(arr2[fiberin2][i][1] == arr1[fiberin2][i][1] && arr2[fiberin2][i][2] == arr1[fiberin2][i][2]){
                      cableInfo[HH]['Equipment'][cablename][fiberin][i][3] =  arr2[fiberin2][i][3]
                      newFibername_old = cablename1
                    }
                    else if (arr2[fiberin2][i].length == 4 && (arr2[fiberin2].length > arr1[fiberin2].length)){
                      if(arr2[fiberin2][0][2].split('-')[0] == arr1[fiberin2][0][2].split('-')[0]){
                        cableInfo[HH]['Equipment'][cablename][fiberin] = arr2[fiberin2]
                        i = arr1[fiberin].length
                        break;
                      }
                    }                     
                    else{
                      newFibername = newFibername_old
                    }
                  }
                }
              }
            }
          }
        }
      }
      //console.log('newFibername: ',newFibername)
      if(newFibername == undefined){
        newFibername = cablename
      }
      cableInfo[HH]['Equipment'][newFibername] = cableInfo[HH]['Equipment'][cablename]
      delete cableInfo[HH]['Equipment'][cablename]
    }
  }
  //bawak masuk info dari cableinfo Equipment untuk show cable mana yang amsuk ke dalam equipment
  for (let HH in cableInfo){
    //change eq detail into fiber splice Info use later
    for(let FiberName in cableInfo[HH]['Equipment']){
      let fNumber_arr =[]
      for(let fNumber in cableInfo[HH]['Equipment'][FiberName]){
        fNumber_arr.push(fNumber)
      }
      // console.log('HH: ',HH)
      // console.log('FiberName: ',FiberName)
      // console.log(cableInfo[HH])
      let len = fNumber_arr.length - 1
      let eqInfo = [`${fNumber_arr[0]}-${fNumber_arr[len]}`, '' ,'Equipment']
      cableInfo[HH]['SpliceInfo'][FiberName].push(eqInfo)
      //now sort
      cableInfo[HH]['SpliceInfo'][FiberName].sort((a, b) => {
        return parseInt(a[0]) - parseInt(b[0]);
      });
      
      //Object.assign(cableInfo[HH]['SpliceInfo'][FiberName], eqInfo);
    }
  }
  return cableInfo
}

//add HH into Map
function AddHHintoMap(){
  console.log('HH_coordinateL : ',HH_coordinate)
  function convertToTable(description, arr_fibers) {
    var sections = description.split('<strong>').slice(1);

    var tablesHTML = sections.map(function (section) {
        // Extract title
        var titleMatch = section.match(/(.*?)<\/strong>/);
        var title = titleMatch ? titleMatch[1].trim() : '';
        // Extract rows
        var tableHTML = '<table class= "fiberTable" border="1" style="position: relative;"><caption>' + title + ':</caption><thead><tr><td>fiberIn</td><td>fiberOut</td><td>cableOut</td></tr></thead><tbody>';
        rows = arr_fibers[title]

        for(let i = 0; i < rows.length; i++){
          tableHTML += '<tr><td>' + rows[i][0] + '</td><td>' + rows[i][1] + '</td><td>' + rows[i][2] + '</td></tr>';
        }
        tableHTML += '</tbody></table>';

        return tableHTML;
    });

    return tablesHTML.join('<br>');
  }
  function findDirection(HHName,fiberName){
    const splitNames = fiberName.split('_to_');
    let namecable = splitNames[0]
    let nameHH = splitNames[1]

    let Info = HH_Before[HHName]['Info']
    for (let words in Info){
      if(namecable == Info[words][0] && nameHH == Info[words][4]){
        return Info[words][3]
      }
    }
  }
  function groupConsecutiveNumbersWithSameValue(arr) {
    let result = [];
    let start = parseInt(arr[0][0]);
    let end = start;
    let sameValue = arr[0][1];

    for (let i = 1; i < arr.length; i++) {
        let current = parseInt(arr[i][0]);
        let currentValue = arr[i][1];

        if (current === end + 1 && currentValue === sameValue) {
            end = current;
        } else {
            if (start === end) {
                let totalValue = end - start + 1
                //result.push(start.toString() + ' ' + sameValue);
                result.push(`IN (${start.toString()}) ${arr[0][2]}(${arr[0][3]}) TO ${totalValue} ${sameValue}`)
            } else {
                let totalValue = end - start + 1
                //result.push(start.toString() + '-' + end.toString() + ' ' + sameValue);
                result.push(`IN (${start.toString()}-${end.toString()}) ${arr[0][2]}(${arr[0][3]}) TO ${totalValue} ${sameValue}`)
            }
            start = current;
            end = current;
            sameValue = currentValue;
        }
    }

    // Add the last range
    if (start === end) {
        let totalValue = end - start + 1
        //result.push(start.toString() + ' ' + sameValue + ' ' + arr[0][2]);
        result.push(`IN (${start.toString()}) ${arr[0][2]}(${arr[0][3]}) TO ${totalValue} ${sameValue}`)
    } else {
        let totalValue = end - start + 1
        //result.push(start.toString() + '-' + end.toString() + ' ' + sameValue + ' ' +  arr[0][2]);
        result.push(`IN (${start.toString()}-${end.toString()}) ${arr[0][2]}(${arr[0][3]}) TO ${totalValue} ${sameValue}`)
    }

    return result;
  }
  function extractFOC(inputString) {
    const splitNames = inputString.split('_to_');
    let namecable = splitNames[0]
    if(namecable.startsWith('LA') || namecable.startsWith('BB'))
    {
      return namecable
    }
    else{
      const lastIndex = namecable.lastIndexOf('-');
      if (lastIndex !== -1 && lastIndex < namecable.length - 1) {
          return namecable.substring(lastIndex + 1);
      } else {
          return namecable;
      }
    }
    
  }
  function findDuplicateNames(data) {
    const names = {};
    const duplicateNames = [];

    data.forEach(entry => {
        const name = entry[0];
        if (names[name]) {
            // If the name is already encountered, store it as a duplicate
            duplicateNames.push(name);
        } else {
            // Mark the name as encountered
            names[name] = true;
        }
    });

    return duplicateNames;
  }
  //find the duplicate name of HH
  //let duplicateHH = findDuplicateNames(HH_coordinate)
  console.log('duplicateHH: ',duplicateHH)
  let popup = ''
  if(duplicateHH.length > 0){
    for(let i = 0; i< duplicateHH.length; i++){
      popup += `${duplicateHH[i]}\n`
    }
    //alert("Duplicate HH's name: \n" + popup)
  }

  //create HH into map
  HH_coordinate.forEach((feature, hh_index) => {
    let description = '', eq_desc = ''
    let arr_fibers = {}
    const name = feature[0]
    const lat = feature[1];
    const lon = feature[2];
    const passthroughFiber = HH_Before[name].Passthrough

    //getInfo that not cut and passthrough for simplified splicing INFO
    let labelDesc = [], new_desc =[], arrKeys =[]
    //for splicing
    for(let fibername in HH_Before[name]['SpliceInfo']){
      let arr = HH_Before[name]['SpliceInfo'][fibername]
      for(let i =0; i < arr.length; i++){
        //console.log('arr[i][2]: ',arr[i][2])
        if(arr[i][2] == 'Cut' || arr[i][2] == 'Passthrough'){
          continue
        }
        else{
          let directionIn = findDirection(name,fibername)
          let directionOut
          let foc_in = extractFOC(fibername)
          let foc_out = extractFOC(arr[i][2])
          if(arr[i][2] === "Equipment"){
            continue
          }
          else{
            if(passthroughFiber.length > 0){
              if(passthroughFiber.includes(arr[i][2])){
                directionOut = findDirection(name,arr[i][2])
                labelDesc.push(`IN (${arr[i][1]}) ${foc_out}(${directionOut}) TO (${arr[i][0]}) ${foc_in}(${directionIn})<br>`)
              }
            }
            else{
              directionOut = findDirection(name,arr[i][2])
              labelDesc.push(`IN (${arr[i][1]}) ${foc_out}(${directionOut}) TO (${arr[i][0]}) ${foc_in}(${directionIn})<br>`)
            }          
          }
        }
      }
    }
    //for equipment
    for(let fibername in HH_Before[name]['Equipment']){
      let direction = findDirection(name,fibername)
      let keys = Object.keys(HH_Before[name]['Equipment'][fibername])
      let arr_check =[]
      for(let i = 0; i < keys.length; i++){
        if(HH_Before[name]['Equipment'][fibername][keys[i]][0].length === 4){
          arr_check.push([keys[i],'PS', extractFOC(fibername), direction])
          HH_coordinate[hh_index][3] = 'PS'
        }
        else{
          arr_check.push([keys[i],'DTS', extractFOC(fibername), direction])
        }

        for(let j = 0; j <HH_Before[name]['Equipment'][fibername][keys[i]].length; j++ ){
          let inc
          let arr = HH_Before[name]['Equipment'][fibername][keys[i]][j]
          if (i == 0){
            inc = 0
          }
          else{
            inc = i * 8
          }
          
          if(arr.length ==4){
            let parts = arr[1].split('-')
            let PortRange
            if(parts.length > 1){
              let val1 = Number(parts[0]) + inc
              let val2 = Number(parts[1]) + inc
              PortRange = `${val1}-${val2}`
            }
            else{
              let val1 = Number(parts[0]) + inc
              PortRange = `${val1}`
            }
            let direction = findDirection(name,arr[3])
            let foc_out = extractFOC(arr[3])
            if(direction == undefined){
              new_desc.push(`IN (PORT ${PortRange}) TO DTS`)
            }
            else{
              new_desc.push(`IN (PORT ${PortRange}) TO (${arr[2]}) ${foc_out}(${direction})`)
            }
          }       
        }
      }
      arrKeys.push(groupConsecutiveNumbersWithSameValue(arr_check))
      
      // console.log('new_desc: ',new_desc)
      // console.log('arrKeys: ',arrKeys)
    }
    //SplicingInfo
    for(let fibername in HH_Before[name]['SpliceInfo']){
      let Fname = fibername.split('_to_')
      let fname = Fname[0]
      let dir = findDirection(name,fibername)
      arr = HH_Before[name]['SpliceInfo'][fibername]
      temp_arrfibers2 =[]
      for(let desc in arr){
        temp_arrfibers =[]
        for(let i = 0; i < arr[desc].length; i++){
          let newFname = arr[desc][i].split('_to_')
          if(newFname.length == 2){
            let a = newFname[0]
            let dir = findDirection(name,arr[desc][i])
            temp_arrfibers.push(`${a}(${dir[0]})`)
          }
          else{
            temp_arrfibers.push(arr[desc][i])
          }
        }
        temp_arrfibers2.push(temp_arrfibers)
      }     
      fibername = `${fname}(${dir[0]})`
      description += '<strong>' + fibername + '</strong>'
      arr_fibers[fibername] = temp_arrfibers2
    }
    let new_description = convertToTable(description,arr_fibers)
    //Equipment
    for(let fibername in HH_Before[name]['Equipment']){
      let Fname = fibername.split('_to_')
      let fname = Fname[0]
      let dir = findDirection(name,fibername)
      eq_desc += '<strong> Cable In:' + `${fname}(${dir[0]})` + '</strong><br>'
      for(let fiberIn in HH_Before[name]['Equipment'][fibername]){
        let arr = HH_Before[name]['Equipment'][fibername][fiberIn]

        //console.log('nameHH', name ,'\narr',arr)
        if(arr[0].length > 1){
          eq_desc += `<table class= "fiberTable" border="1" style = "position: relative;"><thead>
          <tr>
          <td>Fiber In</td>
          <td>Equipment</td>
          <td>Port</td>
          <td>Fiber Out</td>
          <td> Cable Out</td>
          </tr></thead>
          <tbody>`
        }
        else{
          eq_desc += `<table class= "fiberTable" border="1" style = "position: relative;"><thead>
          <tr>
          <td>Fiber In</td>
          <td>Equipment</td>
          </tr></thead>
          <tbody>
          `
        }
        for(let i = 0; i < arr.length; i++){
          if(arr[i].length == 1){
            eq_desc +=`<tr>
            <td>${fiberIn}</td>
            <td>${arr[i][0]}</td>
            </tr>`
          }
          else{
            let Fname = arr[i][3].split('_to_')
            let newFiberName = arr[i][3]
            if(Fname.length==2){
              let fname = Fname[0]
              let dir = findDirection(name,arr[i][3])
              newFiberName = `${fname}(${dir[0]})`
            }
            
            if(i == 0){
              eq_desc +=`<tr>
              <td>${fiberIn}</td>
              <td>${arr[i][0]}</td>
              <td>${arr[i][1]}</td>
              <td>${arr[i][2]}</td>
              <td>${newFiberName}</td>
              </tr>`
            }
            else{
              eq_desc +=`<tr>
              <td></td>
              <td>${arr[i][0]}</td>
              <td>${arr[i][1]}</td>
              <td>${arr[i][2]}</td>
              <td>${newFiberName}</td>
              </tr>`
            }
            
          }
        }
        eq_desc += `</tbody>
        </table>
        <br>
        `
      }
    }

    let popupContent = `
    <div class="custom-popup">
        <div id="page1">
            <h2><strong>${name} : </strong> Splicing Information (simplified)</h2>
            <strong>${name}</strong><br>
            ${labelDesc.join('')}
            ${arrKeys.join('<br>')}<br>
            ${new_desc.join('<br>')}<br>
        </div>

        <div id="page2" style="display: none;">
            <h2><strong>${name} : </strong> Splicing Information</h2><br>
            ${new_description}
        </div>

        <div id="page3" style="display: none;">
            <h2><strong>${name} : </strong> Equipment</h2>
            ${eq_desc}
        </div>
        <div id="navigation">
            <button onclick="showPage(1)">1</button>
            <button onclick="showPage(2)">2</button>
            <button onclick="showPage(3)">3</button>
        </div>
    </div>
  `;
  
    let additionalStyles = `
      <style>
          .custom-popup {
              max-height: 200px;
              max-width: 300px;
              overflow-y: auto;
          }
      </style>
    `;
    document.head.innerHTML += additionalStyles;
    // Create circle marker
    let color = 'blue'
    let fillColor = 'lightblue'
    if(HH_coordinate[hh_index][3] == 'PS'){
      color = 'white'
      fillColor = 'black'
    }
    geo_HHlayer = L.circleMarker([lat, lon], {
      radius: 8,
      color: color,
      fillColor: fillColor,
      fillOpacity: 1
    });

    geo_HHlayer.properties = {
      name: name,
      lat: lat,
      long:lon
    };
    // Create a popup with the feature name
    geo_HHlayer.bindPopup(popupContent);

    // Add a click event to show the popup
    geo_HHlayer.on('click', function() {
        this.openPopup();
    });
    geo_HHlayer.addTo(map)
    HHlayer.push(geo_HHlayer)
  })
  
    
    let lat = HH_coordinate[0][1]
    let long = HH_coordinate[0][2]
    let zoomLevel = 15
    map.setView([lat, long], zoomLevel);
  
}

//compare splicing before and after
function CompareSplicing(){
  for (let HH in HH_Before){
    //compare equipment before and after
    if(Object.keys(HH_Before[HH]['SpliceInfo'])[0].includes('FOC')){
      let EqBfr = Object.keys(HH_Before[HH]["Equipment"])
      let EqAftr = Object.keys(HH_After[HH]["Equipment"])
      let temp_checkError_Equipment = []
      if(EqBfr.length != EqAftr.length){
        temp_checkError_Equipment.push(HH,'The Equipment somehow exist here?')
        checkError['Equipment'].push(temp_checkError_Equipment)
      }
      for(let keys in HH_Before[HH]["Equipment"]){
        let temp_checkError =[]
        let inputLength_Before = Object.keys(HH_Before[HH]["Equipment"]).length
        let inputLength_After = Object.keys(HH_After[HH]["Equipment"]).length
  
        if(inputLength_Before != inputLength_After){
          if(inputLength_After == 0){
            temp_checkError.push(HH,'The Equipment doesnt have fiber input')
          }
          else{
            temp_checkError.push(HH,'One of the cable have wrong fiber input')
          }
        }
  
        else{
          let temp_arrAfter = []
          for(let keys_2 in HH_After[HH]["Equipment"]){
            let nameHHto1 = keys.split(`_to_`)
            let nameHHto2 = keys_2.split(`_to_`)
            let LAorBB1 = nameHHto1[0]
            let LAorBB2 = nameHHto2[0]
            if(nameHHto1[0].includes('LA-')){
              LAorBB1 = 'LA'
            }
            else if (nameHHto1[0].includes('BB')){
              LAorBB1 = 'BB'
            }
            if(nameHHto2[0].includes('LA-')){
              LAorBB2 = 'LA'
            }
            else if (nameHHto2[0].includes('BB')){
              LAorBB2 = 'BB'
            }
            let len1 = Object.keys(HH_Before[HH]["Equipment"][keys])
            let len2 = Object.keys(HH_After[HH]["Equipment"][keys_2])
            if(nameHHto1[0] == nameHHto2[0] && len1.length == len2.length && LAorBB1 == LAorBB2 ){
              let sameValue = false
              for(let i = 0; i < len1.length; i++){
                if(len1[i] == len2[i]){
                  sameValue = true
                }
                else{
                  sameValue = false
                  break
                }
              }
              if(sameValue == true){
                temp_arrAfter = HH_After[HH]["Equipment"][keys_2]
                break
              }
            }
          }
          
          if(temp_arrAfter.length == 0){
            temp_checkError.push(HH,'Wrong cable input -- line 1205')
          }
          else{
            for(let fiber in HH_Before[HH]["Equipment"][keys]){
              Arr_After = temp_arrAfter[fiber]
              Arr_Before = HH_Before[HH]["Equipment"][keys][fiber]
              //check input fiber yang masuk dalam equipment
              if(Arr_After.length != Arr_Before.length){
                temp_checkError.push(HH,'Wrong outgoing fiber in the Equipment')
              }
              else{
                for(let i = 0; i <Arr_Before.length; i++ ){
                  for(let j =0; j< Arr_Before[i].length; j++){
                    if(j == 3){
                      let fibername1toHH = Arr_Before[i][j].split('_to_')
                      let fibername2toHH = Arr_After[i][j].split('_to_')
                      let LAorBB1 = fibername1toHH[0]
                      let LAorBB2 = fibername2toHH[0]
                      if(fibername1toHH[0].includes('LA-')){
                        LAorBB1 = 'LA'
                      }
                      else if (fibername1toHH[0].includes('BB')){
                        LAorBB1 = 'BB'
                      }
                      if(fibername2toHH[0].includes('LA-')){
                        LAorBB2 = 'LA'
                      }
                      else if (fibername2toHH[0].includes('BB')){
                        LAorBB2 = 'BB'
                      }
  
                      if(fibername1toHH[1] != fibername2toHH[1]){
                        temp_checkError.push(HH,'Wrong outgoing fiber in the Equipment')
                        break
                      }
                      else if(LAorBB1 != LAorBB2){
                        temp_checkError.push(HH,'Wrong outgoing fiber in the Equipment')
                        break
                      }
                    }
                    else{
                      if(Arr_Before[i][j] != Arr_After[i][j]){
                        //console.log('Arr_After: ',Arr_After[i], 'Arr_Before: ',Arr_Before[i])
                        temp_checkError.push(HH,'Wrong outgoing fiber in the Equipment')
                        break
                        }
                    }
                  }
                }
              }
            }
          }
        }
  
        if(temp_checkError.length > 0){
          checkError['Equipment'].push(temp_checkError)
        }
      }
      //compare splice before and after
      for(let keys in HH_Before[HH]["SpliceInfo"]){
        let temp_checkError = []
        let CableLength_Before = Object.keys(HH_Before[HH]["SpliceInfo"]).length
        let CableLength_After = Object.keys(HH_After[HH]["SpliceInfo"]).length
        passthrough = HH_After[HH]['Passthrough']
        let new_passthrough =[]
        //adjust input inside passthrough to HH
        for(let i = 0; i< passthrough.length; i++){
          let _to = passthrough[i].split('_to_')[1]
          new_passthrough.push(_to)
        }
        //kalau cable yang connect ke HH ttoal length tak sama
        if(CableLength_Before != CableLength_After){
          console.log(HH,'are not connect with cable')
          //console.log('CableLength_Before: ',CableLength_Before, 'CableLength_After: ',CableLength_After)
          temp_checkError.push(HH, 'Missing Cable')
        }
        //Kalau HH tu ada passthrough
        if(new_passthrough.length>0){
          let keys_Cab = keys.split('_to_')[0]
          let keys_HH = keys.split('_to_')[1]
          //check cable yang tak passthrough dulu
          if(!new_passthrough.includes(keys_HH)){
            let len_before = HH_Before[HH]["SpliceInfo"][keys].length
            //cari keys untuk hhafter
            let temp_arrAfter =[], temp_che = false
            for(let keys_2 in HH_After[HH]["SpliceInfo"]){
              let nameHHto1 = keys.split(`_to_`)
              let nameHHto2 = keys_2.split(`_to_`)
              let LAorBB1 = nameHHto1[0]
              let LAorBB2 = nameHHto2[0]
              if(nameHHto1[0].includes('LA-')){
                LAorBB1 = 'LA'
              }
              else if (nameHHto1[0].includes('BB')){
                LAorBB1 = 'BB'
              }
              if(nameHHto2[0].includes('LA-')){
                LAorBB2 = 'LA'
              }
              else if (nameHHto2[0].includes('BB')){
                LAorBB2 = 'BB'
              }
              let len1 = HH_Before[HH]["SpliceInfo"][keys].length
              let len2 = HH_After[HH]["SpliceInfo"][keys_2].length
              if(nameHHto1[1] == nameHHto2[1] && len1 == len2 && LAorBB1 == LAorBB2){
                temp_arrAfter = HH_After[HH]["SpliceInfo"][keys_2]
                temp_che = true
                break;
              }
            }
            if(temp_che == false){
              temp_checkError.push(HH,'Wrong cable input -- line 1316')
            }
            else{
              for(let i = 0; i < len_before; i++ ){
                let value_before
                let value_after
                try{
                  value_before = HH_Before[HH]["SpliceInfo"][keys][i]
                  value_after = temp_arrAfter[i]
                }
                catch(error){
                  value_after = undefined
                }
  
                if(value_after == undefined || value_before.length != value_after.length){
                  temp_checkError.push(HH, 'Wrong Splicing1')
                }
                else{
                  for(let j = 0; j < value_before.length; j++){
                    if(j == 1){
                      let fibername1toHH = value_before[j].split('_to_')
                      let fibername2toHH = value_after[j].split('_to_')
                      let LAorBB1 = fibername1toHH[0]
                      let LAorBB2 = fibername2toHH[0]
                      if(fibername1toHH[0].includes('LA-')){
                        LAorBB1 = 'LA'
                      }
                      else if (fibername1toHH[0].includes('BB')){
                        LAorBB1 = 'BB'
                      }
                      if(fibername2toHH[0].includes('LA-')){
                        LAorBB2 = 'LA'
                      }
                      else if (fibername2toHH[0].includes('BB')){
                        LAorBB2 = 'BB'
                      }
  
                      if(fibername1toHH[1] != fibername2toHH[1] && LAorBB1 != LAorBB2){
                        temp_checkError.push(HH,'Wrong Splicing2')
                        break
                      }
                    }
                    else{
                      if(value_before[j] != value_after[j]){
                        temp_checkError.push(HH, 'Wrong Splicing2')
                        i = len_before
                        break;
                      }
                    }
                    
                  }
                }
              }
            }
          }
          
        }
        else{
          let len_before = HH_Before[HH]["SpliceInfo"][keys].length
          //cari keys untuk hhafter
          let temp_arrAfter =[], temp_che = false
          for(let keys_2 in HH_After[HH]["SpliceInfo"]){
            let nameHHto1 = keys.split(`_to_`)
            let nameHHto2 = keys_2.split(`_to_`)
            let LAorBB1 = nameHHto1[0]
            let LAorBB2 = nameHHto2[0]
            if(nameHHto1[0].includes('LA-')){
              LAorBB1 = 'LA'
            }
            else if (nameHHto1[0].includes('BB')){
              LAorBB1 = 'BB'
            }
            if(nameHHto2[0].includes('LA-')){
              LAorBB2 = 'LA'
            }
            else if (nameHHto2[0].includes('BB')){
              LAorBB2 = 'BB'
            }
            let len1 = HH_Before[HH]["SpliceInfo"][keys].length
            let len2 = HH_After[HH]["SpliceInfo"][keys_2].length
            // if( HH == 'BWK7-05-01-01-01-HH'){
            //   console.log('LAorBB1: ',LAorBB1, '\nLAorBB2: ',LAorBB2)
            //   console.log(LAorBB1 == LAorBB2)
            //   console.log('nameHHto1: ',nameHHto1[1], '\nnameHHto2: ',nameHHto2[1])
            //   console.log(nameHHto1[1] == nameHHto2[1])
            //   console.log('len1: ',len1, '\nlen2: ',len2)
            //   console.log(len1 == len2)
            // }
            if(nameHHto1[1] == nameHHto2[1] && len1 == len2 && LAorBB1 == LAorBB2){
              temp_arrAfter = HH_After[HH]["SpliceInfo"][keys_2]
              temp_che = true
              break;
            }
          }
          if(temp_che == false){
            temp_checkError.push(HH,'Wrong cable input- line 1411')
          }
          else{
            for(let i = 0; i < len_before; i++ ){
              let value_before
              let value_after
              try{
                value_before = HH_Before[HH]["SpliceInfo"][keys][i]
                value_after = temp_arrAfter[i]
              }
              catch(error){
                value_after = undefined
              }
  
              if(value_after == undefined || value_before.length != value_after.length){
                temp_checkError.push(HH, 'Wrong Splicing1')
              }
              else{
                for(let j = 0; j < value_before.length; j++){
                  if(j == 1){
                    let fibername1toHH = value_before[j].split('_to_')
                    let fibername2toHH = value_after[j].split('_to_')
                    let LAorBB1 = fibername1toHH[0]
                    let LAorBB2 = fibername2toHH[0]
                    if(fibername1toHH[0].includes('LA-')){
                      LAorBB1 = 'LA'
                    }
                    else if (fibername1toHH[0].includes('BB')){
                      LAorBB1 = 'BB'
                    }
                    if(fibername2toHH[0].includes('LA-')){
                      LAorBB2 = 'LA'
                    }
                    else if (fibername2toHH[0].includes('BB')){
                      LAorBB2 = 'BB'
                    }
  
                    if(fibername1toHH[1] != fibername2toHH[1] && LAorBB1 != LAorBB2){
                      temp_checkError.push(HH,'Wrong Splicing2')
                      break
                    }
                  }
                  else{
                    if(value_before[j] != value_after[j]){
                      temp_checkError.push(HH, 'Wrong Splicing2')
                      i = len_before
                      break;
                    }
                  }
                }
              }
            }
          }
          if(temp_checkError.length > 0){
            checkError['Splicing'].push(temp_checkError)
          }
        }
        if(temp_checkError.length > 0){
          checkError['Splicing'].push(temp_checkError)
        }
      }
    }
    else{
      //compare equipment before and after
      for(let keys in HH_Before[HH]["Equipment"]){
        let temp_checkError =[]
        let inputLength_Before = Object.keys(HH_Before[HH]["Equipment"]).length
        let inputLength_After = Object.keys(HH_After[HH]["Equipment"]).length

        if(inputLength_Before != inputLength_After){
          if(inputLength_After == 0){
            temp_checkError.push(HH,'The Equipment doesnt have fiber input')
          }
          else{
            temp_checkError.push(HH,'One of the cable have wrong fiber input')
          }
        }

        else{
          let temp_arrAfter = []
          for(let keys_2 in HH_After[HH]["Equipment"]){
            let nameHHto1 = keys.split(`_to_`)[1]
            let nameHHto2 = keys_2.split(`_to_`)[1]
            let LAorBB1 = nameHHto1[0]
            let LAorBB2 = nameHHto2[0]
            if(nameHHto1[0].includes('LA-')){
              LAorBB1 = 'LA'
            }
            else if (nameHHto1[0].includes('BB')){
              LAorBB1 = 'BB'
            }
            if(nameHHto2[0].includes('LA-')){
              LAorBB2 = 'LA'
            }
            else if (nameHHto2[0].includes('BB')){
              LAorBB2 = 'BB'
            }
            let len1 = Object.keys(HH_Before[HH]["Equipment"][keys])
            let len2 = Object.keys(HH_After[HH]["Equipment"][keys_2])
            if(nameHHto1 == nameHHto2 && len1.length == len2.length && LAorBB1 == LAorBB2 ){
              let sameValue = false
              for(let i = 0; i < len1.length; i++){
                if(len1[i] == len2[i]){
                  sameValue = true
                }
                else{
                  sameValue = false
                  break
                }
              }
              if(sameValue == true){
                temp_arrAfter = HH_After[HH]["Equipment"][keys_2]
                break
              }
            }
          }
          
          if(temp_arrAfter.length == 0){
            temp_checkError.push(HH,'Wrong cable input -- line1529')
          }
          else{
            for(let fiber in HH_Before[HH]["Equipment"][keys]){
              Arr_After = temp_arrAfter[fiber]
              Arr_Before = HH_Before[HH]["Equipment"][keys][fiber]
              //check input fiber yang masuk dalam equipment
              if(Arr_After.length != Arr_Before.length){
                temp_checkError.push(HH,'Wrong outgoing fiber in the Equipment')
              }
              else{
                for(let i = 0; i <Arr_Before.length; i++ ){
                  for(let j =0; j< Arr_Before[i].length; j++){
                    if(j == 3){
                      let fibername1toHH = Arr_Before[i][j].split('_to_')
                      let fibername2toHH = Arr_After[i][j].split('_to_')
                      let LAorBB1 = fibername1toHH[0]
                      let LAorBB2 = fibername2toHH[0]
                      if(fibername1toHH[0].includes('LA-')){
                        LAorBB1 = 'LA'
                      }
                      else if (fibername1toHH[0].includes('BB')){
                        LAorBB1 = 'BB'
                      }
                      if(fibername2toHH[0].includes('LA-')){
                        LAorBB2 = 'LA'
                      }
                      else if (fibername2toHH[0].includes('BB')){
                        LAorBB2 = 'BB'
                      }

                      if(fibername1toHH[1] != fibername2toHH[1]){
                        temp_checkError.push(HH,'Wrong outgoing fiber in the Equipment')
                        break
                      }
                      else if(LAorBB1 != LAorBB2){
                        temp_checkError.push(HH,'Wrong outgoing fiber in the Equipment')
                        break
                      }
                    }
                    else{
                      if(Arr_Before[i][j] != Arr_After[i][j]){
                        //console.log('Arr_After: ',Arr_After[i], 'Arr_Before: ',Arr_Before[i])
                        temp_checkError.push(HH,'Wrong outgoing fiber in the Equipment')
                        break
                        }
                    }
                  }
                }
              }
            }
          }
        }
        if(temp_checkError.length > 0){
          checkError['Equipment'].push(temp_checkError)
        }
      }
      //compare splice before and after
      for(let keys in HH_Before[HH]["SpliceInfo"]){
        let temp_checkError = []
        let CableLength_Before = Object.keys(HH_Before[HH]["SpliceInfo"]).length
        let CableLength_After = Object.keys(HH_After[HH]["SpliceInfo"]).length
        passthrough = HH_After[HH]['Passthrough']
        let new_passthrough =[]
        //adjust input inside passthrough to HH
        if(passthrough == undefined){
          HH_After[HH]['Passthrough'] = {}
          passthrough = HH_After[HH]['Passthrough']
        }
        for(let i = 0; i< passthrough.length; i++){
          let _to = passthrough[i].split('_to_')[1]
          new_passthrough.push(_to)
        }
        //kalau cable yang connect ke HH ttoal length tak sama
        if(CableLength_Before != CableLength_After){
          console.log(HH,'are not connect with cable')
          //console.log('CableLength_Before: ',CableLength_Before, 'CableLength_After: ',CableLength_After)
          temp_checkError.push(HH, 'Missing Cable')
        }

        //Kalau HH tu ada passthrough
        if(new_passthrough.length>0){
          let keys_HH = keys.split('_to_')[1]
          //check cable yang tak passthrough dulu
          if(!new_passthrough.includes(keys_HH)){
            let len_before = HH_Before[HH]["SpliceInfo"][keys].length
            //cari keys untuk hhafter
            let temp_arrAfter =[], temp_che = false
            for(let keys_2 in HH_After[HH]["SpliceInfo"]){
              let nameHHto1 = keys.split(`_to_`)
              let nameHHto2 = keys_2.split(`_to_`)
              let LAorBB1 = nameHHto1[0]
              let LAorBB2 = nameHHto2[0]
              if(nameHHto1[0].includes('LA-')){
                LAorBB1 = 'LA'
              }
              else if (nameHHto1[0].includes('BB')){
                LAorBB1 = 'BB'
              }
              if(nameHHto2[0].includes('LA-')){
                LAorBB2 = 'LA'
              }
              else if (nameHHto2[0].includes('BB')){
                LAorBB2 = 'BB'
              }
              
              let len1 = HH_Before[HH]["SpliceInfo"][keys].length
              let len2 = HH_After[HH]["SpliceInfo"][keys_2].length
              if(nameHHto1[1] == nameHHto2[1] && len1 == len2 && LAorBB1 == LAorBB2){
                temp_arrAfter = HH_After[HH]["SpliceInfo"][keys_2]
                temp_che = true
                break;
              }
            }
            if(temp_che == false){
              temp_checkError.push(HH,'Wrong cable input -- line 1644')
            }
            else{
              for(let i = 0; i < len_before; i++ ){
                let value_before
                let value_after
                try{
                  value_before = HH_Before[HH]["SpliceInfo"][keys][i]
                  value_after = temp_arrAfter[i]
                }
                catch(error){
                  value_after = undefined
                }

                if(value_after == undefined || value_before.length != value_after.length){
                  temp_checkError.push(HH, 'Wrong Splicing1')
                }
                else{
                  for(let j = 0; j < value_before.length; j++){
                    if(j == 1){
                      let fibername1toHH = value_before[j].split('_to_')
                      let fibername2toHH = value_after[j].split('_to_')
                      let LAorBB1 = fibername1toHH[0]
                      let LAorBB2 = fibername2toHH[0]
                      if(fibername1toHH[0].includes('LA-')){
                        LAorBB1 = 'LA'
                      }
                      else if (fibername1toHH[0].includes('BB')){
                        LAorBB1 = 'BB'
                      }
                      if(fibername2toHH[0].includes('LA-')){
                        LAorBB2 = 'LA'
                      }
                      else if (fibername2toHH[0].includes('BB')){
                        LAorBB2 = 'BB'
                      }

                      if(fibername1toHH[1] != fibername2toHH[1] && LAorBB1 != LAorBB2){
                        temp_checkError.push(HH,'Wrong Splicing2')
                        break
                      }
                    }
                    else{
                      if(value_before[j] != value_after[j]){
                        temp_checkError.push(HH, 'Wrong Splicing2')
                        i = len_before
                        break;
                      }
                    }
                    
                  }
                }
              }
            }
          }
          else{}
        }
        else{ 
          let len_before = HH_Before[HH]["SpliceInfo"][keys].length
          //cari keys untuk hhafter
          let temp_arrAfter =[], temp_che = false
          for(let keys_2 in HH_After[HH]["SpliceInfo"]){
            let nameHHto1 = keys.split(`_to_`)
            let nameHHto2 = keys_2.split(`_to_`)
            let LAorBB1 = nameHHto1[0]
            let LAorBB2 = nameHHto2[0]
            if(nameHHto1[0].includes('LA-')){
              LAorBB1 = 'LA'
            }
            else if (nameHHto1[0].includes('BB')){
              LAorBB1 = 'BB'
            }
            if(nameHHto2[0].includes('LA-')){
              LAorBB2 = 'LA'
            }
            else if (nameHHto2[0].includes('BB')){
              LAorBB2 = 'BB'
            }
            
            let len1 = HH_Before[HH]["SpliceInfo"][keys].length
            let len2 = HH_After[HH]["SpliceInfo"][keys_2].length
            if(nameHHto1[1] == nameHHto2[1] && len1 == len2 && LAorBB1 == LAorBB2){
              temp_arrAfter = HH_After[HH]["SpliceInfo"][keys_2]
              temp_che = true
              break;
            }
          }
          if(temp_che == false){
            temp_checkError.push(HH,'Wrong cable input -- line 1732')
          }
          else{
            for(let i = 0; i < len_before; i++ ){
              let value_before
              let value_after
              try{
                value_before = HH_Before[HH]["SpliceInfo"][keys][i]
                value_after = temp_arrAfter[i]
              }
              catch(error){
                value_after = undefined
              }

              if(value_after == undefined || value_before.length != value_after.length){
                temp_checkError.push(HH, 'Wrong Splicing1')
              }
              else{
                for(let j = 0; j < value_before.length; j++){
                  if(j == 1){
                    let fibername1toHH = value_before[j].split('_to_')
                    let fibername2toHH = value_after[j].split('_to_')
                    let LAorBB1 = fibername1toHH[0]
                    let LAorBB2 = fibername2toHH[0]
                    if(fibername1toHH[0].includes('LA-')){
                      LAorBB1 = 'LA'
                    }
                    else if (fibername1toHH[0].includes('BB')){
                      LAorBB1 = 'BB'
                    }
                    if(fibername2toHH[0].includes('LA-')){
                      LAorBB2 = 'LA'
                    }
                    else if (fibername2toHH[0].includes('BB')){
                      LAorBB2 = 'BB'
                    }

                    if(fibername1toHH[1] != fibername2toHH[1] && LAorBB1 != LAorBB2){
                      temp_checkError.push(HH,'Wrong Splicing2')
                      break
                    }
                  }
                  else{
                    if(value_before[j] != value_after[j]){
                      temp_checkError.push(HH, 'Wrong Splicing2')
                      i = len_before
                      break;
                    }
                  }
                }
              }
            }
          }
          if(temp_checkError.length > 0){
            checkError['Splicing'].push(temp_checkError)
          }
        } 
      }
    }
    
  }

  console.log('checkError: ',checkError)
  return checkError
}

//set page in popup
function showPage(pageNumber) {
  for (let i = 1; i <= 3; i++) {
      document.getElementById('page' + i).style.display = (i === pageNumber) ? 'block' : 'none';
  }
}

//color HH with wrong Splicing or Equipment
function HighlightWrongHH(checkError){
  let HHeq = [], HHsplicing =[]
  //equipment
  for (let i=0; i< checkError['Equipment'].length; i++ ){
    let HHname = checkError['Equipment'][i][0]
    if(!HHeq.includes(HHname)){
      HHeq.push(HHname)
    }
  }

  //splicing
  for (let i=0; i< checkError['Splicing'].length; i++ ){
    let HHname = checkError['Splicing'][i][0]
    if(!HHsplicing.includes(HHname)){
      HHsplicing.push(HHname)
    }
  }

  //color based on HH punya salah
  let wrongHH = []
  for(let i = 0; i < HHeq.length; i++){
    if(!wrongHH.includes(HHeq[i])){
      wrongHH.push(HHeq[i])
    }

    let index = 0
    HH_coordinate.forEach(feature =>{
      let HHname = feature[0]
      if(HHname == HHeq[i]){
        HHlayer[index].setStyle({
          color: 'green',
          fillColor: 'lightgreen',
          fillOpacity: 1
        });
      }
      index += 1
    })
  }

  for(let i = 0; i < HHsplicing.length; i++){
    if(!wrongHH.includes(HHsplicing[i])){
      wrongHH.push(HHsplicing[i])
    }

    let index = 0
    HH_coordinate.forEach(feature =>{
      let HHname = feature[0]
      if(HHname == HHsplicing[i]){
        HHlayer[index].setStyle({
          color: 'red',
          fillColor: 'lightcoral',
          fillOpacity: 1
        });
      }
      index += 1
    })
  } 

  for(let i = 0; i < HHeq.length; i++){
    let index = 0
    if(HHsplicing.includes(HHeq[i])){
      console.log('Both eq and Splicing got error??')
      HH_coordinate.forEach(feature =>{
        let HHname = feature[0]
        if(HHname == HHeq[i]){
          HHlayer[index].setStyle({
            color: 'yellow',
            fillColor: 'lightyellow',
            fillOpacity: 1
          });
        }
        index += 1
      })
    }
    
    index += 1
  }

  console.log('wrongHH: ',wrongHH)
  if(wrongHH.length == 0){
    alert('No Error')
  }
  else{
    alert(`${wrongHH.length} Error HH`)
    alert('Green : Equipment Error\nRed : Splicing Error\nYellow : Both Equipment and Splicing error')
    var legendControl = L.control({position: 'bottomright'});
    // Define the content for the control
    legendControl.onAdd = function(map) {
      var div = L.DomUtil.create('div', 'info legend');
      div.innerHTML +=
          '<div style="border: 1px solid #ccc; padding: 5px; background-color: white; color: black;">' +
              `FAIL HH: ${wrongHH.length}` +
          '</div>' +
          '<div style="border: 1px solid #ccc; border-top: none; padding: 5px; background-color: green; color: black;">' +
              '<strong>Green:</strong> Equipment Error' +
          '</div>' +
          '<div style="border: 1px solid #ccc; border-top: none; padding: 5px; background-color: red; color: black;">' +
              '<strong>Red:</strong> Splicing Error' +
          '</div>' +
          '<div style="border: 1px solid #ccc; border-top: none; padding: 5px; background-color: yellow; color: black;">' +
              '<strong>Yellow:</strong> Both Equipment and Splicing Error' +
          '</div>';
      return div;
    };

  // Add the control to the map
  legendControl.addTo(map);
  }
}

