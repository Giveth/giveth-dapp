class MilestoneModel {
  constructor(){
    this.id = Math.random().toString(36).substr(2, 10)
    this.title = ''
    this.description =''
    this.image = ''
    this.videoUrl = ''
    this.ownerAddress =''
    this.reviewerAddress = ''      
    this.recipientAddress =''
    this.donationsReceived = 0
    this.donationsGiven = 0
    this.completionDeadline = new Date()
    this.completionStatus = 'pending'
  }
}

export default MilestoneModel