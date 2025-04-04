/**
 * 用户状态管理模块
 */
const state = {
  name: '',
  phone: '',
  userType: 'team_leader', // team_leader或team_member
  teamCode: '',
  avatar: '',
  openid: '',
  // 表单状态
  formState: {
    isValid: false,
    userType: 'team_leader', 
    teamCode: '',
    agreeTerms: false
  },
  // 表单验证函数
  formValidator: null
}

const getters = {
  userInfo: state => ({
    name: state.name,
    phone: state.phone,
    userType: state.userType,
    teamCode: state.teamCode,
    avatar: state.avatar,
    openid: state.openid
  }),
  isTeamLeader: state => state.userType === 'team_leader',
  isFormValid: state => state.formState.isValid
}

const mutations = {
  SET_USER_INFO(state, { name, phone, avatar, openid }) {
    state.name = name || state.name
    state.phone = phone || state.phone
    if (avatar !== undefined) state.avatar = avatar
    if (openid !== undefined) state.openid = openid
  },
  SET_USER_TYPE(state, type) {
    state.userType = type
  },
  SET_TEAM_CODE(state, code) {
    state.teamCode = code
  },
  SET_FORM_STATE(state, formState) {
    state.formState = { ...state.formState, ...formState }
  },
  SET_FORM_VALIDATOR(state, validator) {
    state.formValidator = validator
  }
}

const actions = {
  /**
   * 更新用户信息
   */
  updateUserInfo({ commit }, userData) {
    commit('SET_USER_INFO', userData)
  },
  
  /**
   * 设置用户类型（团队领导/团队成员）
   */
  setUserType({ commit }, type) {
    commit('SET_USER_TYPE', type)
  },
  
  /**
   * 设置团队码
   */
  setTeamCode({ commit }, code) {
    commit('SET_TEAM_CODE', code)
  },
  
  /**
   * 更新表单状态
   */
  updateFormState({ commit }, formState) {
    commit('SET_FORM_STATE', formState)
  },
  
  /**
   * 设置表单验证器
   */
  setFormValidator({ commit }, validator) {
    commit('SET_FORM_VALIDATOR', validator)
  },
  
  /**
   * 处理表单提交或显示
   */
  submitHandler() {
    const form = document.getElementById('registration-form')
    if (form) {
      form.style.display = 'block'
      form.scrollIntoView({ behavior: 'smooth' })
    }
  }
}

export default {
  namespaced: true,
  state,
  getters,
  actions,
  mutations
} 