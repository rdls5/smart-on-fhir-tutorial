(function(window){
  window.extractData = function() {
    
    var ret = $.Deferred();

    function onError() {
      console.log('Loading error', arguments);
      ret.reject();
    }

    function onReady(smart)  {
      if (smart.hasOwnProperty('patient')) {
        var patient = smart.patient;
        
        var ptdata = JSON.stringify(patient);
        console.log('smart.patient - ID: ' + ptdata);   //retrieves the pt id in JSON format
        
        var pt = patient.read();
      
        //retrieve patient resource
        var pat = smart.patient.api.fetchAll({
                    type: 'Patient',
                    query: {
                      code: {
                        $or: ['http://loinc.org|45392-8', 'http://loinc.org|45394-4',
                              'http://loinc.org|21112-8', 'http://loinc.org|21840-4']
                      }
                    }
                  });
        //end 
        
        var obv = smart.patient.api.fetchAll({
                    type: 'Observation',
                    query: {
                      code: {
                        $or: ['http://loinc.org|8302-2', 'http://loinc.org|8462-4',
                              'http://loinc.org|8480-6', 'http://loinc.org|2085-9',
                              'http://loinc.org|2089-1', 'http://loinc.org|55284-4']
                      }
                    }
                  });
        
        $.when(pt, pat).fail(onError);
        
        $.when(pt, obv).fail(onError);
        
        $.when(pt, obv).done(function(patient, obv) {
           console.log('OBSERVATION RESOURCE: ' + '\n' + JSON.stringify(obv)); 
          
            //***get patient resource in JSON format
          var ptres = '';
          $.when(pt, pat).done(function(patient, pat) {
            ptres = JSON.stringify(pat);
            console.log('PATIENT RESOURCE INSIDE the function: ' + '\n' + ptres);          
            //ret.resolve(ptres);
          });
        
          console.log('PATIENT RESOURCE OUTSIDE the function: ' + '\n' + ptres);          
          //***end
            
           //retrieve pt json file
        
          var byCodes = smart.byCodes(obv, 'code');
          var gender = patient.gender;
          var fname = '';
          var lname = '';

          if (typeof patient.name[0] !== 'undefined') {
            fname = patient.name[0].given.join(' ');
            lname = patient.name[0].family.join(' ');
          }

          var height = byCodes('8302-2');
          var systolicbp = getBloodPressureValue(byCodes('55284-4'),'8480-6');
          var diastolicbp = getBloodPressureValue(byCodes('55284-4'),'8462-4');
          var hdl = byCodes('2085-9');
          var ldl = byCodes('2089-1');
         
          var p = defaultPatient();
          
          p.birthdate = patient.birthDate;
          p.gender = gender;
          p.fname = fname;
          p.lname = lname;
          p.height = getQuantityValueAndUnit(height[0]);
          p.ptres = ptres;
         
          console.log('DEFAULT PATIENT BASIC INFO: ' + '\n' + JSON.stringify(p)); // get patient demographics json
      
          if (typeof systolicbp != 'undefined')  {
            p.systolicbp = systolicbp;
          }

          if (typeof diastolicbp != 'undefined') {
            p.diastolicbp = diastolicbp;
          }

          p.hdl = getQuantityValueAndUnit(hdl[0]);
          p.ldl = getQuantityValueAndUnit(ldl[0]);

          ret.resolve(p);
        });
      } else {
        onError();
      }
    }

    FHIR.oauth2.ready(onReady, onError);
    return ret.promise();

  };

  function defaultPatient(){
    return {
      fname: {value: ''},
      lname: {value: ''},
      gender: {value: ''},
      birthdate: {value: ''},
      height: {value: ''},
      systolicbp: {value: ''},
      diastolicbp: {value: ''},
      ldl: {value: ''},
      hdl: {value: ''},
      ptres: {value: ''},
    };
  }

  function getBloodPressureValue(BPObservations, typeOfPressure) {
    var formattedBPObservations = [];
    BPObservations.forEach(function(observation){
      var BP = observation.component.find(function(component){
        return component.code.coding.find(function(coding) {
          return coding.code == typeOfPressure;
        });
      });
      if (BP) {
        observation.valueQuantity = BP.valueQuantity;
        formattedBPObservations.push(observation);
      }
      
    });
   
    return getQuantityValueAndUnit(formattedBPObservations[0]);
  }

  function getQuantityValueAndUnit(ob) {
    if (typeof ob != 'undefined' &&
        typeof ob.valueQuantity != 'undefined' &&
        typeof ob.valueQuantity.value != 'undefined' &&
        typeof ob.valueQuantity.unit != 'undefined') {
          return ob.valueQuantity.value + ' ' + ob.valueQuantity.unit;
    } else {
      return undefined;
    }
  }

  window.drawVisualization = function(p) {
    console.log('fname: ' + p.fname);
    $('#holder').show();
    $('#loading').hide();
    $('#fname').html(p.fname);
    $('#lname').html(p.lname);
    $('#gender').html(p.gender);
    $('#birthdate').html(p.birthdate);
    $('#height').html(p.height);
    $('#systolicbp').html(p.systolicbp);
    $('#diastolicbp').html(p.diastolicbp);
    $('#ldl').html(p.ldl);
    $('#hdl').html(p.hdl);
    $('#ptres').html(p.ptres);
  };
  
})(window);
