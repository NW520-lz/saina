// 小纸条 💌
//
// 这里是陪伴用户的话，小泽会在对应的时机「递」给她，她收到的纸条会收进「我的 → 小纸条盒」。
// 想改就直接改文字，想加就照格式加一行；同一个时机的纸条会轮流出现，没看过的最先出现。
//
// when 可选值（见 domain/notes.js）：
//   periodStart  经期第 1 天
//   period       经期第 2 天起
//   periodEnd    记录月经结束的那天
//   pain         当天疼痛 ≥ 7 分
//   mood         当天心情低落 / 焦虑 / 烦躁
//   premenstrual 预计 1–3 天后来月经
//   streak       连续打卡 7、14、21… 天

export const LOVE_NOTES = [
	// —— 经期第 1 天 ——
	{ when: 'periodStart', text: '今天开始要辛苦几天了。热水袋准备好了吗？' },
	{ when: 'periodStart', text: '第一天可能比较难熬，今天别逞强，想躺就躺。' },
	{ when: 'periodStart', text: '姨妈来了也没关系，今天的你只需要负责被照顾。' },
	{ when: 'periodStart', text: '我没办法替你痛，但可以一直陪你说话，难受了随时找我。' },

	// —— 经期中 ——
	{ when: 'period', text: '今天有没有好一点？记得多喝热水——不是敷衍，是真的心疼你。' },
	{ when: 'period', text: '再坚持几天，又是那个活蹦乱跳的你了。' },
	{ when: 'period', text: '今天累了就早点睡，给自己留一点休息时间。' },
	{ when: 'period', text: '这几天情绪起伏也没关系，先照顾好自己。' },
	{ when: 'period', text: '饮食按自己的感受来，选择让身体舒服的食物。' },

	// —— 月经结束 ——
	{ when: 'periodEnd', text: '辛苦啦！这一轮你又熬过来了，奖励自己一点好吃的吧。' },
	{ when: 'periodEnd', text: '月经结束啦，愿你慢慢恢复元气。' },
	{ when: 'periodEnd', text: '这几天你真的很勇敢，我都看在眼里。' },

	// —— 很痛的时候 ——
	{ when: 'pain', text: '看到你今天这么痛，先躺下，热敷一下，别硬撑。' },
	{ when: 'pain', text: '如果止痛药也压不住，或者痛到冒冷汗、头晕，一定要尽快就医。' },
	{ when: 'pain', text: '痛的时候不用假装没事，想哭就哭一下，先陪自己缓一缓。' },
	{ when: 'pain', text: '今天的任务只有一个：好好休息。别的事情都可以往后放。' },

	// —— 心情不好的时候 ——
	{ when: 'mood', text: '不开心的时候不用急着变好，先抱抱。' },
	{ when: 'mood', text: '烦躁也好、低落也好，不需要马上解释清楚。' },
	{ when: 'mood', text: '今天辛苦了。可以给信任的人发条消息，说说你的感受。' },
	{ when: 'mood', text: '你已经做得很好了，真的，不许对自己太严格。' },
	{ when: 'mood', text: '有些情绪是激素在捣乱，不是你不好。' },

	// —— 经前几天 ——
	{ when: 'premenstrual', text: '月经快来啦，包里可以备好卫生用品。' },
	{ when: 'premenstrual', text: '经前容易烦，有情绪可以找信任的人聊聊。' },
	{ when: 'premenstrual', text: '这几天早点睡，泡泡脚，给身体留点力气。' },

	// —— 连续打卡 ——
	{ when: 'streak', text: '连续记录 7 天啦！你认真照顾自己的样子，真的很可爱。' },
	{ when: 'streak', text: '又坚持了一周，我替你的身体跟你说声谢谢。' },
	{ when: 'streak', text: '看到你每天都在记录，继续保持对身体的关注。' }
]
