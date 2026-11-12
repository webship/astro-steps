import { useState } from 'preact/hooks';

// An island: Astro renders it to HTML on the server and, with a client:*
// directive, hydrates it in the browser.
export default function Counter({ label }) {
	const [count, setCount] = useState(0);
	return (
		<div class="counter">
			<span>{label}</span>
			<button type="button" onClick={() => setCount(count + 1)}>
				Increment {label}
			</button>
			<output>{count}</output>
		</div>
	);
}
