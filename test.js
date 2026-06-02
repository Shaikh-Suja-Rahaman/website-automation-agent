import readline from "readline"


const rl = readline.createInterface({
  input : process.stdin,
  output : process.stdout
})

let text = null;


// while(true){
//   rl.question("What is your name? ", (answer) => {
//   // console.log(answer);
//   text = answer;

//   console.log(text);

// });

// }


const askQuestion = (query) => {
  return new Promise((resolve) => rl.question(query, resolve));
}

while(true){
  const name = await askQuestion("");
  console.log(name);

}
