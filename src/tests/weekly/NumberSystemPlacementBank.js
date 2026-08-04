const LEVELS = ["Foundation Check", "Placement Core", "Advanced Applications", "Company Challenge"];
const levelFor = index => index < 20 ? LEVELS[0] : index < 75 ? LEVELS[1] : index < 120 ? LEVELS[2] : LEVELS[3];
const fmt = value => Number.isInteger(value) ? String(value) : Number(value.toFixed(2)).toString();
const gcd = (a, b) => { while (b) [a, b] = [b, a % b]; return Math.abs(a); };
const lcm = (a, b) => Math.abs(a * b) / gcd(a, b);
const powMod = (base, exponent, modulus) => {
  let result = 1n, value = BigInt(base) % BigInt(modulus), power = BigInt(exponent), mod = BigInt(modulus);
  while (power) { if (power & 1n) result = result * value % mod; value = value * value % mod; power >>= 1n; }
  return Number(result);
};
const factorise = value => {
  const factors = [];
  let rest = value;
  for (let p = 2; p * p <= rest; p++) {
    if (rest % p) continue;
    let e = 0;
    while (rest % p === 0) { rest /= p; e++; }
    factors.push([p, e]);
  }
  if (rest > 1) factors.push([rest, 1]);
  return factors;
};
const factorCount = n => factorise(n).reduce((product, [, exponent]) => product * (exponent + 1), 1);
const factorSum = n => factorise(n).reduce((product, [prime, exponent]) => product * ((prime ** (exponent + 1) - 1) / (prime - 1)), 1);
const squareMultiplier = n => factorise(n).reduce((product, [prime, exponent]) => product * (exponent % 2 ? prime : 1), 1);
const factorialPrimePower = (n, prime) => { let total = 0; while (n) { n = Math.floor(n / prime); total += n; } return total; };

const MULTI_STEP = new Set(["HCF-LCM identity","Unknown number from HCF and LCM","Highest prime power in factorial","Inclusion-exclusion counting"]);
const REVERSE = new Set(["Least addition for divisibility","Least subtraction for divisibility","Missing digit divisibility","Unknown number from HCF and LCM","Equal-remainder divisor"]);
const CONTEXTUAL = new Set(["Recurring events","Multiples in an interval","Reversal of digits","Greatest n-digit multiple","Equal-remainder divisor","Least multiplier for a square","Least square common multiple"]);

function question(id, pattern, text, answer, wrong, method, format = fmt) {
  const correct = format(answer);
  const options = [answer, ...wrong].map(format).filter((value, index, all) => all.indexOf(value) === index);
  let bump = 1;
  while (options.length < 4) { const candidate = format(Number(answer) + bump++); if (!options.includes(candidate)) options.push(candidate); }
  const level = levelFor(id);
  const assessmentStyle = MULTI_STEP.has(pattern) ? "multi-step" : REVERSE.has(pattern) ? "reverse" : CONTEXTUAL.has(pattern) ? "contextual" : "direct";
  const reasoningDepth = MULTI_STEP.has(pattern) ? (level === LEVELS[3] ? "advanced" : "two-step") : REVERSE.has(pattern) ? "two-step" : "single-step";
  return {
    id,
    level,
    subtopic: pattern,
    patternId: pattern.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
    q: text,
    assessmentStyle,
    reasoningDepth,
    opts: options,
    ans: options.indexOf(correct),
    idealTimeSeconds: level === LEVELS[0] ? 25 : level === LEVELS[1] ? 35 : level === LEVELS[2] ? 50 : 65,
    shortcut: `Translate the wording into the governing ${pattern.toLowerCase()} relation first, then reduce the arithmetic before multiplying.`,
    commonMistake: `Do not confuse the requested value with an intermediate remainder, factor, multiple, or exponent in this ${pattern.toLowerCase()} problem.`,
    solution: `Concept: ${pattern}. Method and calculation: ${method} The calculation uses the stated values directly and preserves the required divisibility or remainder condition. Final answer check: substituting the result back into the question gives ${correct}.`,
  };
}

const PATTERNS = [
  (id,v)=>{const n=438+37*v,d=7+v,r=n%d,a=(d-r)%d;return question(id,"Least addition for divisibility",`What least positive number must be added to ${n} to make it divisible by ${d}?`,a,[r,d,a+1],`${n} leaves remainder ${r}; the gap to the next multiple is ${d}-${r}=${a}.`);},
  (id,v)=>{const n=617+41*v,d=9+v,a=n%d;return question(id,"Least subtraction for divisibility",`What least number must be subtracted from ${n} to make it exactly divisible by ${d}?`,a,[d-a,a+1,d],`The least subtraction equals the remainder. ${n}=${d} x ${Math.floor(n/d)}+${a}.`);},
  (id,v)=>{const known=4+3+2+v,target=Math.ceil(known/9)*9,a=target-known;return question(id,"Missing digit divisibility",`Find digit x if the number 43x2${v} is divisible by 9.`,a,[(a+1)%10,(a+2)%10,(a+3)%10],`The digit sum is ${known}+x. The next multiple of 9 is ${target}, so x=${target}-${known}=${a}.`);},
  (id,v)=>{const a=72+12*v,b=120+18*v,h=gcd(a,b);return question(id,"HCF of numbers",`Find the greatest number that divides both ${a} and ${b} exactly.`,h,[lcm(a,b),h+6,Math.max(1,h-6)],`Retain only common prime powers. HCF(${a},${b})=${h}.`);},
  (id,v)=>{const a=12+2*v,b=18+3*v,m=lcm(a,b);return question(id,"LCM of numbers",`Find the least positive number divisible by both ${a} and ${b}.`,m,[gcd(a,b),m+a,m-gcd(a,b)],`Take every prime at its greatest occurring power. LCM(${a},${b})=${m}.`);},
  (id,v)=>{const h=2+v,left=2*v+3,right=2*v+5,a=h*left,b=h*right,m=lcm(a,b);return question(id,"HCF-LCM identity",`The numbers are ${a} and ${b}, and their HCF is ${h}. Find their LCM.`,m,[a*b,h,a+b],`The co-prime residual factors are ${left} and ${right}. Using HCF x LCM = product, LCM=${a} x ${b}/${h}=${m}.`);},
  (id,v)=>{const h=2+v,left=2*v+3,right=2*v+5,a=h*left,b=h*right,m=lcm(a,b),answer=h*m/a;return question(id,"Unknown number from HCF and LCM",`Two numbers have HCF ${h} and LCM ${m}. One number is ${a}; find the other.`,answer,[m/a,h*m,answer+h],`Other number=(HCF x LCM)/known number=(${h} x ${m})/${a}=${answer}. Verification: HCF(${a},${b})=${h} and LCM=${m}.`);},
  (id,v)=>{const base=24+6*v,x=base+5,y=base+5+18*(v+1),z=base+5+30*(v+1),answer=gcd(y-x,z-x);return question(id,"Equal-remainder divisor",`Find the greatest number that divides ${x}, ${y}, and ${z}, leaving the same remainder.`,answer,[gcd(x,y),answer+1,Math.max(1,answer-1)],`Equal remainders cancel in differences. HCF(${y-x},${z-x})=${answer}.`);},
  (id,v)=>{const a=5+v,b=7+v,c=9+v,answer=lcm(lcm(a,b),c);return question(id,"Recurring events",`Three alarms repeat every ${a}, ${b}, and ${c} minutes. They ring together now; when will they next ring together?`,answer,[gcd(gcd(a,b),c),answer-a,answer+c],`The first simultaneous recurrence is LCM(${a},${b},${c})=${answer} minutes.`);},
  (id,v)=>{const n=2**(2+v%3)*3**(1+v%2)*5,answer=factorCount(n);return question(id,"Number of positive factors",`How many positive factors does ${n} have?`,answer,[answer-2,answer+2,factorise(n).length*2],`For N written as a product of prime powers, multiply all (exponent+1) terms. For ${n}, the count is ${answer}.`);},
  (id,v)=>{const n=2**(1+v)*3**2,answer=factorSum(n);return question(id,"Sum of positive factors",`Find the sum of all positive factors of ${n}.`,answer,[answer-n,factorCount(n),answer+n],`Apply the geometric-series factor-sum formula to each prime power. Evaluation for ${n} gives ${answer}.`);},
  (id,v)=>{const n=12*(v+1),answer=squareMultiplier(n);return question(id,"Least multiplier for a square",`What least positive integer must multiply ${n} so the product is a perfect square?`,answer,[answer+1,n/answer,answer*2],`Make every prime exponent even. The product of primes with odd exponents is ${answer}.`);},
  (id,v)=>{const n=40+25*v,answer=factorialPrimePower(n,5);return question(id,"Trailing zeroes in factorial",`How many trailing zeroes are present in ${n}!?`,answer,[Math.floor(n/5),answer+1,answer-1],`Count factors of 5: floor(${n}/5)+floor(${n}/25)+...=${answer}.`);},
  (id,v)=>{const n=28+9*v,p=v%2?2:3,answer=factorialPrimePower(n,p);return question(id,"Highest prime power in factorial",`In a coding assessment, a program computes ${n}!. What is the greatest exponent e such that ${p}^e divides the computed factorial exactly?`,answer,[Math.floor(n/p),answer+p,answer-1],`Legendre's formula floor(n/${p})+floor(n/${p**2})+... gives ${answer}.`);},
  (id,v)=>{const b=2+v,e=23+5*v,answer=powMod(b,e,10);return question(id,"Units-digit cyclicity",`Find the units digit of ${b}^${e}.`,answer,[(answer+2)%10,(answer+4)%10,b%10],`Reduce exponent ${e} by the units-digit cycle length of ${b}; the last digit is ${answer}.`);},
  (id,v)=>{const b=7+2*v,e=12+3*v,answer=powMod(b,e,100),two=n=>String(Math.round(n)).padStart(2,"0");return question(id,"Last two digits",`Find the last two digits of ${b}^${e}.`,answer,[(answer+10)%100,(answer+20)%100,powMod(b,e,10)],`Repeated squaring modulo 100 gives remainder ${answer}.`,two);},
  (id,v)=>{const b=4+v,e=18+v,m=11+v,answer=powMod(b,e,m);return question(id,"Remainder of a power",`Find the remainder when ${b}^${e} is divided by ${m}.`,answer,[(answer+1)%m,(answer+3)%m,b%m],`Repeated modular reduction gives remainder ${answer} modulo ${m}.`);},
  (id,v)=>{const n=280+40*v,a=3+v,b=5+v,answer=Math.floor(n/a)+Math.floor(n/b)-Math.floor(n/lcm(a,b));return question(id,"Inclusion-exclusion counting",`A placement portal assigns registration IDs from 1 through ${n}. How many IDs are divisible by ${a} or ${b}, counting an ID divisible by both only once?`,answer,[Math.floor(n/a)+Math.floor(n/b),answer+1,answer-1],`Apply inclusion-exclusion: floor(${n}/${a})+floor(${n}/${b})-floor(${n}/${lcm(a,b)})=${answer}.`);},
  (id,v)=>{const low=110+20*v,high=480+40*v,d=6+v,answer=Math.floor(high/d)-Math.floor((low-1)/d);return question(id,"Multiples in an interval",`A quality-control system reviews serial numbers from ${low} through ${high}, both inclusive. How many reviewed serial numbers are exact multiples of ${d}?`,answer,[answer+1,answer-1,Math.floor(high/d)-Math.floor(low/d)],`Count through ${high} and subtract the count below ${low}: ${answer}.`);},
  (id,v)=>{const binary=[101101,110011,111010,100111,101011,110101][v-1],answer=parseInt(String(binary),2);return question(id,"Binary to decimal conversion",`Convert the base-2 number ${binary} to decimal.`,answer,[answer+1,answer-2,binary%100],`Weight the bits by powers of 2 and add. The decimal value is ${answer}.`);},
  (id,v)=>{const decimal=24+7*v,base=3+v%3,converted=decimal.toString(base),answer=Number(converted);return question(id,"Decimal to another base",`Convert decimal ${decimal} to base ${base}; select the correct digit string.`,answer,[decimal,answer+1,Number((decimal-1).toString(base))],`Repeated division by ${base} gives remainders read upward: ${converted} in base ${base}.`);},
  (id,v)=>{const h=3+v,t=2+v,u=1+v,n=100*h+10*t+u,r=100*u+10*t+h,answer=Math.abs(n-r);return question(id,"Reversal of digits",`Find the absolute difference between ${n} and the number obtained by reversing its digits.`,answer,[n+r,answer/9,answer+99],`The reverse is ${r}; therefore |${n}-${r}|=${answer}.`);},
  (id,v)=>{const n=5+v,answer=n*(n+1)/2;return question(id,"Sum of consecutive integers",`Evaluate the sum of all natural numbers from 1 through ${n}, inclusive.`,answer,[n*n,answer+n,answer-1],`The first n natural numbers sum to n(n+1)/2=${n} x ${n+1}/2=${answer}.`);},
  (id,v)=>{const a=5+v,b=7+2*v,base=lcm(a,b),answer=base*squareMultiplier(base);return question(id,"Least square common multiple",`A square arrangement must contain a number of units divisible by both ${a} and ${b}. What is the least perfect-square number of units that satisfies both constraints?`,answer,[base,base**2,answer+base],`LCM(${a},${b})=${base}; multiply by ${squareMultiplier(base)} so every prime exponent becomes even. Answer=${answer}.`);},
  (id,v)=>{const digits=3+v%2,d=9+v,limit=10**digits-1,answer=limit-limit%d;return question(id,"Greatest n-digit multiple",`A system accepts only ${digits}-digit transaction codes that are exactly divisible by ${d}. What is the greatest valid code the system can accept?`,answer,[answer-d,answer+d,limit],`Subtract remainder ${limit%d} from the greatest ${digits}-digit number ${limit}; result=${answer}.`);},
];

export function numberSystemPlacementBank() {
  return Array.from({ length: 150 }, (_, id) => PATTERNS[id % PATTERNS.length](id, Math.floor(id / PATTERNS.length) + 1));
}

export const NUMBER_SYSTEM_PATTERN_COUNT = PATTERNS.length;
