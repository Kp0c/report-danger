import './style.css'
import { defineComponents } from "./components/define-components";

defineComponents();

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
 <rd-app></rd-app>
`;
