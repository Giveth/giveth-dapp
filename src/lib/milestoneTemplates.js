import config from '../configuration';

export default {
  templates: {
    None: ``,
    'Reward DAO': `
          <p>
              <span style="font-size: 18px;">Intro: (optional)</span>
          </p>
          <p>
            <em>Intro text talking about what you’ve been working on and why.</em>
          </p>
          <p>
            <br>
          </p>
          <p>
            <span style="font-size: 18px;">Description:</span>
          </p>
          <p>
            <em>Description what has been achieved</em>
          </p>
          <p>
            <br>
          </p>
          <p>
            <span style="font-size: 18px;">Proof:</span>
          </p>
          <p>
            <em>Bullet points with links</em>
          </p>
          <p>
            <br>
          </p>
          <p>
            <span style="font-size: 18px;">Video:</span>
          </p>
          <p>
            <em>Embedded video coming from&nbsp;</em>
            <a href="https://fame.giveth.io/" target="_blank" style="background-color: transparent; color: rgb(3, 102, 214);">
                <em>https://fame.giveth.io/</em>
            </a>
          </p>
          <p>
            <br>
          </p>
          <p>
            <span style="font-size: 18px;">Reward:</span>
          </p>
          <p>
            <em style="font-size: 14px; color: rgb(36, 41, 46); font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Helvetica, Arial, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;; background-color: rgb(255, 255, 255);">Amount of points, their type and how much they are worth in ${config.nativeTokenName} and when</em>
          </p>
          <p>
            <em style="font-size: 14px; color: rgb(36, 41, 46); font-family: -apple-system, BlinkMacSystemFont, &quot;Segoe UI&quot;, Helvetica, Arial, sans-serif, &quot;Apple Color Emoji&quot;, &quot;Segoe UI Emoji&quot;, &quot;Segoe UI Symbol&quot;; background-color: rgb(255, 255, 255);">Format should be a list of&nbsp;
                <code>&lt;amount&gt; &lt;type&gt; at &lt;rate&gt;/&lt;type&gt; which is &lt;amount in ${config.nativeTokenName}&gt;</code>
            </em>
          </p>
          `,
    'Regular Reward': `
          <p>
              <span style="font-size: 18px;">Intro: (optional)</span>
          </p>
          <p>
              <em>Intro text talking about what you’ve been working on and why.</em>
          </p>
          <p>
              <br>
          </p>
          <p>
              <span style="font-size: 18px;">Description:</span>
          </p>
          <p>
              <em>Description what has been achieved</em>
          </p>
          <p>
              <em>Optionally links to proof</em>
          </p>
          <p>
              <br>
          </p>
          <p>
              <span style="font-size: 18px;">Video:</span>
          </p>
          <p>
              <em>Embedded video coming from&nbsp;</em>
              <a href="https://fame.giveth.io/" target="_blank" style="background-color: transparent; color: rgb(3, 102, 214);">
                  <em>https://fame.giveth.io/</em>
              </a>
          </p>
          <p>
              <br>
          </p>
          <p>
              <span style="font-size: 18px;">Amount:</span>
          </p>
          <p>
              <em>Amount in selected currency</em>
          </p>
          <p>
              <br>
          </p>
      `,
    Expenses: `
          <p>
              <span style="font-size: 18px;">Description</span>
          </p>
          <p>
              <em>Description why is this an expense</em>
          </p>
          <p>
              <br>
          </p>
          <p>
              <span style="font-size: 18px;">Expenses:</span>
          </p>
          <p>
              <em>Please list your expenses</em>
          </p>
      `,
    Bounties: `
          <p>
              <span style="font-size: 18px;">Intro: (optional)</span>
          </p>
          <p>
              <em>Intro text about the bounty</em>
          </p>
          <p>
              <br>
          </p>
          <p>
              <span style="font-size: 18px;">What:</span>
          </p>
          <p>
              <em>What should be achieved</em>
          </p>
          <p>
              <br>
          </p>
          <p>
              <span style="font-size: 18px;">Why:</span>
          </p>
          <p>
              <em>Why is this a bounty, what is the benefit.</em>
          </p>
          <p>
              <br>
          </p>
          <p>
              <span style="font-size: 18px;">Deadline: (optional)</span>
          </p>
          <p>
              <em>By when the bounty needs to be finished</em>
          </p>
          <p>
              <br>
          </p>
          <p>
              <span style="font-size: 18px;">Link to Bounty: (optional)</span>
          </p>
          <p>
              <em>Link to the bounty on for example status open bounties, or issue on github...</em>
          </p>
          <p>
              <br>
          </p>
      `,
  },
};
