import axios from 'axios';
import { $ } from './bling';

function ajaxHeart(e) {
  e.preventDefault();
  const url = this.action;
  axios
  .post(url)
  .then(response => {
    const isHearted = this.heart.classList.toggle('heart__button--hearted');
    console.log(isHearted);
    $('.heart-count').textCount = response.data.hearts.length;
    if(isHearted) {
      this.heart.classList.add('heart__button--float');
      setTimeout(() => {
        this.heart.classList.remove('heart__button--float');
      }, 2500);
    }
  })
  .catch(console.error);
}

export default ajaxHeart