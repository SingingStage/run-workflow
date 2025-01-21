async function run() {
  try {
    // Dynamically retrieve all inputs from the environment
    const inputs = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (key.startsWith('INPUT_')) {
        const inputName = key.slice('INPUT_'.length).toLowerCase(); // Remove 'INPUT_' prefix and normalize
        inputs[inputName] = value;
      }
    }

    // Print all inputs as a JSON object
    console.log('All inputs provided to the workflow_dispatch event:');
    console.log(JSON.stringify(inputs, null, 2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1); // Exit with a failure code
  }
}

run();
