import figlet from "figlet";
import chalk from "chalk";
import { rainbow } from "gradient-string";
import boxen from "boxen";
import readlineSync from "readline-sync";
import { runAgent } from "./agent.js";


figlet("Auto-browser", function (err, data) {
    if (err) {
        console.log(chalk.red("❌ Error creating ASCII art"));
        console.log(chalk.yellow("Auto-Browser CLI"));
        return;
    }
    console.log(rainbow(data));
});


console.log(
    boxen(chalk.bold.gray("🚀 Welcome to Auto-Browser CLI!"), {
        padding: 1,
        margin: 1,
        borderStyle: "round",
        borderColor: "cyan",
    })
);


function showLoadingSpinner(message = "Processing") {
    const spinnerChars = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let i = 0;

    return setInterval(() => {
        process.stdout.write(`\r${chalk.cyan(spinnerChars[i])} ${message}...`);
        i = (i + 1) % spinnerChars.length;
    }, 100);
}


function clearSpinner(spinner) {
    clearInterval(spinner);
    process.stdout.write('\r' + ' '.repeat(50) + '\r'); // Clear the line
}


async function main() {
    try {

        const query = readlineSync.question(chalk.blue("📝 Enter your query: "));


        if (!query || !query.trim()) {
            console.log(chalk.red("❌ Please enter a valid query."));
            console.log(chalk.yellow("💡 Tip: Try asking something like 'search for news about AI' or 'find information about weather'"));
            process.exit(1);
        }


        const spinner = showLoadingSpinner("Running agent");

        try {

            await runAgent(query.trim());


            clearSpinner(spinner);
            console.log(chalk.green("✅ Agent completed successfully!"));

        } catch (agentError) {

            clearSpinner(spinner);
            console.log(chalk.red("❌ Agent Error:"), agentError.message);
            console.log(chalk.yellow("💡 Try rephrasing your query or check your network connection"));
        }

    } catch (error) {

        console.log(chalk.red("❌ Unexpected Error:"), error.message);
        console.log(chalk.gray("Stack trace:"), error.stack);
    }
}


process.on('SIGINT', () => {
    console.log(chalk.yellow("\n\n👋 Goodbye! Thanks for using Auto-Browser CLI!"));
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log(chalk.yellow("\n\n👋 Process terminated. Goodbye!"));
    process.exit(0);
});


main().catch((error) => {
    console.log(chalk.red("❌ Fatal Error:"), error.message);
    process.exit(1);
});