import { createStore } from 'vuex'
import activity from './modules/activity'
import user from './modules/user'
import payment from './modules/payment'
import registration from './modules/registration'
import system from './modules/system'
import danmu from './modules/danmu'

export default createStore({
  modules: {
    activity,
    user,
    payment,
    registration,
    system,
    danmu
  }
}) 