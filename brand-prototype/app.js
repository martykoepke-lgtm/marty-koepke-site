const views=[...document.querySelectorAll('[data-view]')];
const links=[...document.querySelectorAll('[data-route]')];
const menu=document.querySelector('.menu-button');
const nav=document.querySelector('#primary-nav');

function show(route){
  const known=views.some(view=>view.dataset.view===route);
  const next=known?route:'home';
  views.forEach(view=>view.classList.toggle('active',view.dataset.view===next));
  links.forEach(link=>link.classList.toggle('active',link.dataset.route===next));
  nav.classList.remove('open');
  menu.setAttribute('aria-expanded','false');
  window.scrollTo({top:0,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
  document.title=`${next[0].toUpperCase()+next.slice(1)} — Marty Koepke`;
}

window.addEventListener('hashchange',()=>show(location.hash.slice(1)));
links.forEach(link=>link.addEventListener('click',()=>show(link.dataset.route)));
menu.addEventListener('click',()=>{const open=nav.classList.toggle('open');menu.setAttribute('aria-expanded',String(open));});

document.querySelectorAll('.open-dialog').forEach(button=>button.addEventListener('click',()=>document.getElementById(button.dataset.dialog).showModal()));
document.querySelectorAll('dialog').forEach(dialog=>{
  dialog.querySelectorAll('.dialog-close,.dialog-close-action').forEach(button=>button.addEventListener('click',()=>dialog.close()));
  dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close();});
});

show(location.hash.slice(1)||'home');
