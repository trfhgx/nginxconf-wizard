import inquirer from 'inquirer';

/**
 * Build main menu choices based on current state
 */
export function getMainMenuChoices(servers) {
  const choices = [
    { name: 'Add a server block', value: 'add-server' },
    { name: 'Add a global upstream', value: 'add-upstream' }
  ];

  if (servers.length > 0) {
    choices.push(
      { name: 'Edit a server', value: 'edit-server' },
      { name: 'Remove a server', value: 'remove-server' }
    );
  }

  choices.push(
    new inquirer.Separator(),
    { name: 'Edit global settings', value: 'edit-global' },
    new inquirer.Separator()
  );

  if (servers.length > 0) {
    choices.push({ name: 'Done - Generate configuration', value: 'done' });
  } else {
    choices.push({ name: 'Done (add at least one server first)', value: 'noop', disabled: true });
  }

  choices.push({ name: 'Cancel', value: 'cancel' });

  return choices;
}

/**
 * Build server edit menu choices
 */
export function getServerEditMenuChoices(server) {
  const choices = [
    { name: 'Add location', value: 'add-location' },
    { name: 'Add upstream', value: 'add-upstream' },
    { name: 'Edit domain settings', value: 'edit-domain' },
    { name: 'Edit SSL settings', value: 'edit-ssl' }
  ];

  if (server.locations?.length > 0) {
    choices.push(
      { name: 'Edit location', value: 'edit-location' },
      { name: 'Remove location', value: 'remove-location' }
    );
  }

  if (server.upstreams?.length > 0) {
    choices.push(
      { name: 'Edit upstream', value: 'edit-upstream' },
      { name: 'Remove upstream', value: 'remove-upstream' }
    );
  }

  choices.push(
    new inquirer.Separator(),
    { name: 'Back to main menu', value: 'back' }
  );

  return choices;
}

/**
 * Build upstream choices for location configuration
 */
export function getUpstreamChoices(serverUpstreams, globalUpstreams) {
  const choices = [];
  
  if (serverUpstreams?.length > 0) {
    choices.push(
      ...serverUpstreams.map(u => ({ 
        name: `Upstream: ${u.name}`, 
        value: { type: 'upstream', name: u.name } 
      }))
    );
  }
  
  if (globalUpstreams?.length > 0) {
    choices.push(
      ...globalUpstreams.map(u => ({ 
        name: `Global: ${u.name}`, 
        value: { type: 'upstream', name: u.name } 
      }))
    );
  }
  
  choices.push(
    new inquirer.Separator(),
    { name: 'Enter URL directly', value: { type: 'direct' } },
    { name: 'Create new upstream first', value: { type: 'new' } }
  );

  return choices;
}

/**
 * Build server selection choices
 */
export function getServerSelectionChoices(servers) {
  return servers.map(s => ({
    name: `${s.domain.primary}${s.ssl?.enabled ? ' [SSL]' : ''} (${s.locations?.length || 0} locations)`,
    value: s.id
  }));
}

/**
 * Build location selection choices
 */
export function getLocationSelectionChoices(locations) {
  return locations.map(l => ({
    name: `${l.path} (${l.type})`,
    value: l.id
  }));
}

/**
 * Build upstream selection choices
 */
export function getUpstreamSelectionChoices(upstreams) {
  return upstreams.map(u => ({
    name: `${u.name} (${u.servers?.length || 0} servers)`,
    value: u.id
  }));
}
