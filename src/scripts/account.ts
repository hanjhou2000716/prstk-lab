// @ts-nocheck
import { bindAccountControls } from './workbench-sync';

const bootstrap = () => {
  document.getElementById('account-form')?.addEventListener('submit', event => event.preventDefault());
  bindAccountControls();
};
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bootstrap, { once: true });
else bootstrap();
