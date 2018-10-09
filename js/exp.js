//Data
const block_para_lists = [{
    instruction: "<p>Each puzzle will begin with a cross at the center of the screen for you to focus on. After this, a cue word will appear, followed by the word puzzle. +Use the cue word to figure out what the word is, as quickly and accurately as possible, and press the space bar as soon as you have solved it. You will then be prompted to key in the missing letter of the word on your keyboard. +Please make sure to only press the space bar when you have solved the word! +After you have read and understood these instructions, please press [spacebar (to be changed)] to begin some practice trials.</p>",
    stim_csv: "wordlist_p1.csv",
    debrief: "<p>Prac1 debrief?</p>",
    feedback:true
  },
  {
    instruction: "<p>Hopefully you're getting the hang of this now! +Now, you will be given a few more practice trials but without feedback, to help you try and get used to the speed of the real task. +Please press [key] when you are ready to continue. </p>",
    stim_csv: "wordlist_p2.csv",
    debrief: "<p>Well done! You should now be ready to do the real task. Whenever you are ready, you can press [key] to begin.</p>",
    feedback:false
  },
  {
    instruction: "<p>blah blah blah</p>",
    stim_csv: "wordlist_exp.csv",
    debrief: "<p>blah blah blah</p>",
    feedback:false,
    split: function(stim_list){
      var n = 4;
      var valence_type = [...new Set(stim_list.map(stim => stim.valence))];  //got all valence types
      var block_size = stim_list.length / n; 
      if (!Number.isInteger(block_size)) {
        alert('The no. of stimuli is not divisible by the block no. required. Some stimuli will not be used.');
        block_size = Math.floor(block_size);
      }
        var n_stim_per_valence = {};
      var sorted_list = {};
      var block_list = [];
       
        valence_type.forEach(function(w) { 
          sorted_list[w] = jsPsych.randomization.shuffle(stim_list.filter(stim=>stim.valence==w));
          n_stim_per_valence[w] = sorted_list[w].length;
        });

      for (i = 0;i<n;i++) {
          let block = [];
        valence_type.forEach(w=>block.push(...sorted_list[w].slice(i*n_stim_per_valence[w]/n,
              i*n_stim_per_valence[w]/n + n_stim_per_valence[w]/n )));
        block_list.push(jsPsych.randomization.shuffle(block))
      }
      
      return block_list;

    }
  }
];

const fixation = {
  type: 'html-keyboard-response',
  stimulus: '<p class="stimulus">+</p>',
  choices: jsPsych.NO_KEYS,
  trial_duration: 1000,
  post_trial_gap: 500
}

const instruction_text = '<p>In this task, you will be required to solve some "word puzzles", which are basically words with a single letter missing. +For each puzzle, you will be given a cue word to help you solve it. +Please press [spacebar, to be changed] to receive further instructions on how to respond.</p>'+
    '<p>Blah Blah Blah Blah</p>';


const debrief_text ="<p>You have now come to the end of this task! Well done! +When you are ready to continue, [further instructions to follow]</p>";

//for testing purpose only to be deleted
const test_stimuli = [
  {prime: 'woman', valence: 'neutral', stem: 'gent_eman', correct_ans:'a'},
  {prime: 'hey', valence: 'neutral', stem: 'hel_o', correct_ans:'l'}

];


//Functions

function buildInstruction(text) {
  return  {
    type: 'html-keyboard-response', 
    //please refine the instruction below, use <p> and </p> to surround every line"
    stimulus: text +
      '<p>When you are ready to begin, press Y or N.</p>',
    choices: ['y','n']
  }
}

function buildDebrief(text) {
  return {
    type: 'html-keyboard-response',
    stimulus: "<p>blah blah blah DONE</p>" ,
    prompt: "<p>press any key to take a look on the data</p>" 
  }
}
//Promisify
function readAndBuildBlock(block_para) {
  return new Promise(function(resolve, reject){
    Papa.parse(csv_path + block_para.stim_csv,{
      download : true,
      header : true,
  skipEmptyLines: true,
      complete: function(results){
    resolve(buildBlock(block_para, results.data));
      }
    });
  });
}

function buildBlock(block_para, results) {
  function buildSimpleBlock(block_para,results) {
    return {timeline:[buildInstruction(block_para.instruction),
             trials(results,block_para.feedback),
      buildDebrief(block_para.debrief)]
      }
  }
    var block;
    if (typeof block_para.split === "undefined") {
      return buildSimpleBlock(block_para,results);
    } else {
      block_list = block_para.split(results);
      var timeline = [];
      block_list.forEach(function(w){
        timeline.push(buildSimpleBlock(block_para,w))
      })
  return {'timeline':timeline} ;
    }
    
}

function trials(stimuli, feedback  = false) {
    result = {
      timeline_variables: stimuli,
      randomize_order: true,
      timeline: [
      fixation,
      {
          type: 'html-keyboard-response',
          stimulus: function(){ return "<p class='stimulus'><br/></p><p class='stimulus'>"+jsPsych.timelineVariable('prime',true)+"</p><p class='stimulus'><br/></p>" ; },
          choices: jsPsych.NO_KEYS,
          trial_duration: 750,
      },
      {
          type: 'html-keyboard-response',
          stimulus: function(){ return "<p class='stimulus'><br/></p><p class='stimulus'>"+jsPsych.timelineVariable('prime',true)+"</p>";},
          prompt:function(){return "<p class='stimulus'>"+jsPsych.timelineVariable('stem',true)+"</p>"; }, 
          
          choices: [' '],
          trial_duration: 10000
      },
      {
          type: 'html-keyboard-response',
          stimulus: function(){ return "<p class='stimulus'>What is the missing letter?</p>"; },
          trial_duration: 6000,
          data: function(){
          return {
              word_prime: jsPsych.timelineVariable('prime',true),
              word_stem: jsPsych.timelineVariable('stem',true),
              valence: jsPsych.timelineVariable('valence',true),
              correctans : jsPsych.timelineVariable('correct_ans',true)
          }
        },
        on_finish: function(data){
            if (data.key_press == jsPsych.pluginAPI.convertKeyCharacterToKeyCode(jsPsych.timelineVariable('correct_ans',true))) {
                data.correct = true; 
            } else {
                data.correct = false;
            }
        }
      }
      ]
    }
    if (feedback) {
      result.timeline.push({
        
        type: 'html-keyboard-response',
          stimulus: function(){ return `<p class='stimulus'>${(jsPsych.data.getLastTrialData().values()[0].correct?'Correct':'Wrong')}</p>`; },
          trial_duration: 1000
      })
    }
    return result;
}

//Enviornment constant and variables
const csv_path = "./csv/";
let promises = [];
var timeline = [];



//main()
for (const block_para of block_para_lists) {
  promises.push(readAndBuildBlock(block_para));
}



Promise.all(promises).then(function(){
  timeline.push(buildInstruction(instruction_text));
  for(const block of arguments[0]) {
    timeline.push(block);
  }
  timeline.push(buildDebrief(debrief_text));
  jsPsych.init({
    timeline: timeline,
    on_finish: function() {
        jsPsych.data.displayData();
    },
    default_iti: 0
  });

})
