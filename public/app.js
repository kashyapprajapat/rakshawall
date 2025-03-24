document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const ruleForm = document.getElementById('rule-form');
    const ruleName = document.getElementById('rule-name');
    const ipAddress = document.getElementById('ip-address');
    const rulesContainer = document.getElementById('rules-container');
    const connectionsContainer = document.getElementById('connections-container');
    const refreshConnectionsBtn = document.getElementById('refresh-connections');
    
    // Load initial data
    loadRules();
    loadConnections();
    
    // Event listeners
    ruleForm.addEventListener('submit', addRule);
    refreshConnectionsBtn.addEventListener('click', loadConnections);
    
    // Functions
    async function loadRules() {
      try {
        const response = await fetch('/api/rules');
        const rules = await response.json();
        
        if (rules.length === 0) {
          rulesContainer.innerHTML = '<p>No rules added yet.</p>';
          return;
        }
        
        const rulesHTML = rules.map(rule => `
          <div class="rule-item">
            <div class="rule-info">
              <strong>${rule.name}</strong>
              <p>Blocks IP: ${rule.ipAddress}</p>
            </div>
            <button class="delete-rule" data-name="${rule.name}">Delete</button>
          </div>
        `).join('');
        
        rulesContainer.innerHTML = rulesHTML;
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-rule').forEach(button => {
          button.addEventListener('click', deleteRule);
        });
      } catch (error) {
        rulesContainer.innerHTML = `<p>Error loading rules: ${error.message}</p>`;
      }
    }
    
    async function loadConnections() {
      try {
        connectionsContainer.innerHTML = '<p>Loading connections...</p>';
        
        const response = await fetch('/api/connections');
        const connections = await response.json();
        
        if (connections.length === 0) {
          connectionsContainer.innerHTML = '<p>No active connections found.</p>';
          return;
        }
        
        const connectionsHTML = connections.map(conn => `
          <div class="connection-item">
            <p><strong>${conn.protocol}</strong> ${conn.localAddress} → ${conn.foreignAddress}</p>
            <p>State: ${conn.state}, PID: ${conn.pid}</p>
          </div>
        `).join('');
        
        connectionsContainer.innerHTML = connectionsHTML;
      } catch (error) {
        connectionsContainer.innerHTML = `<p>Error loading connections: ${error.message}</p>`;
      }
    }
    
    async function addRule(e) {
      e.preventDefault();
      
      const rule = {
        name: ruleName.value,
        ipAddress: ipAddress.value
      };
      
      try {
        const response = await fetch('/api/rules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(rule)
        });
        
        const result = await response.json();
        
        if (result.success) {
          ruleName.value = '';
          ipAddress.value = '';
          loadRules();
        } else {
          alert(`Failed to add rule: ${result.error}`);
        }
      } catch (error) {
        alert(`Error: ${error.message}`);
      }
    }
    
    async function deleteRule(e) {
      const name = e.target.dataset.name;
      
      if (confirm(`Are you sure you want to delete the rule "${name}"?`)) {
        try {
          const response = await fetch(`/api/rules/${encodeURIComponent(name)}`, {
            method: 'DELETE'
          });
          
          const result = await response.json();
          
          if (result.success) {
            loadRules();
          } else {
            alert(`Failed to delete rule: ${result.error}`);
          }
        } catch (error) {
          alert(`Error: ${error.message}`);
        }
      }
    }
  });