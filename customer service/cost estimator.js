/**
 * Simple CLI cost estimator (node cost-estimator.js)
 * Usage:
 *   node cost-estimator.js 2000 1200 800 0.00002 2
 * Params:
 *   ticketsPerMonth, messagesPerTicket_user, messagesPerTicket_agent, pricePerChar, translationsPerTicket (1 or 2)
 */
const [,, ticketsArg, userArg, agentArg, priceArg, directionsArg] = process.argv;

const tickets = parseInt(ticketsArg || '2000', 10);
const userChars = parseInt(userArg || '1200', 10);
const agentChars = parseInt(agentArg || '800', 10);
const pricePerChar = parseFloat(priceArg || '0.00002');
const directions = parseInt(directionsArg || '2', 10);

const totalCharsPerTicket = userChars + agentChars;
const costPerTicket = totalCharsPerTicket * pricePerChar * directions;
const monthly = costPerTicket * tickets;

console.log('Tickets/month:', tickets);
console.log('Avg user chars/ticket:', userChars);
console.log('Avg agent chars/ticket:', agentChars);
console.log('Price per char:', pricePerChar);
console.log('Translations per char (directions):', directions);
console.log('Total chars per ticket:', totalCharsPerTicket);
console.log('Cost per ticket (USD):', costPerTicket.toFixed(6));
console.log('Estimated monthly cost (USD):', monthly.toFixed(2));
