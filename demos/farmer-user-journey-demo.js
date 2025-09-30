/**
 * Interactive Farmer User Journey Demo
 * สาธิต User Journey ของเกษตรกรแบบ Interactive
 */

const chalk = require('chalk');
const readline = require('readline');

class FarmerJourneyDemo {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        this.farmer = {
            name: "นายสมชาย ใจดี",
            farm_size: "2.5 ไร่",
            location: "เชียงใหม่",
            herbs: ["ขิง", "ขมิ้น", "ไพล"],
            experience: "5 ปี"
        };
        
        this.application = {
            id: "GACP-2025-001",
            status: "DRAFT",
            created_date: new Date().toLocaleDateString('th-TH'),
            progress: 0
        };
        
        this.journey_steps = [
            { step: 1, name: "เตรียมเอกสาร", duration: "1-2 สัปดาห์", status: "pending" },
            { step: 2, name: "ลงทะเบียนและสมัคร", duration: "1 ชั่วโมง", status: "pending" },
            { step: 3, name: "ชำระเงินเริ่มต้น", duration: "5 นาที", status: "pending" },
            { step: 4, name: "ตรวจสอบเอกสาร", duration: "5-7 วัน", status: "pending" },
            { step: 5, name: "ชำระค่าตรวจประเมิน", duration: "5 นาที", status: "pending" },
            { step: 6, name: "ตรวจประเมินภาคสนาม", duration: "1 วัน", status: "pending" },
            { step: 7, name: "ออกใบรับรอง", duration: "3-5 วัน", status: "pending" }
        ];
    }

    async startDemo() {
        console.clear();
        this.showHeader();
        await this.sleep(1000);
        
        console.log(chalk.cyan('\n🎯 เริ่มต้น User Journey ของเกษตรกรสมุนไพรไทย\n'));
        await this.showFarmerProfile();
        await this.sleep(2000);
        
        for (let i = 0; i < this.journey_steps.length; i++) {
            await this.executeStep(i);
            await this.sleep(1500);
        }
        
        await this.showFinalResults();
        this.rl.close();
    }

    showHeader() {
        console.log(chalk.green.bold('🌿=================================================='));
        console.log(chalk.green.bold('   GACP Certification - Farmer User Journey Demo'));
        console.log(chalk.green.bold('==================================================🌿\n'));
    }

    async showFarmerProfile() {
        console.log(chalk.yellow('👨‍🌾 ข้อมูลเกษตรกร:'));
        console.log(`   ชื่อ: ${chalk.white(this.farmer.name)}`);
        console.log(`   ขนาดฟาร์ม: ${chalk.white(this.farmer.farm_size)}`);
        console.log(`   จังหวัด: ${chalk.white(this.farmer.location)}`);
        console.log(`   สมุนไพร: ${chalk.white(this.farmer.herbs.join(', '))}`);
        console.log(`   ประสบการณ์: ${chalk.white(this.farmer.experience)}\n`);
        
        await this.promptContinue();
    }

    async executeStep(stepIndex) {
        const step = this.journey_steps[stepIndex];
        const progress = Math.round(((stepIndex + 1) / this.journey_steps.length) * 100);
        
        console.log(chalk.blue(`\n📍 Phase ${step.step}: ${step.name}`));
        console.log(chalk.gray(`   ระยะเวลา: ${step.duration}`));
        console.log(chalk.gray(`   ความคืบหน้า: ${progress}%`));
        
        // แสดง progress bar
        this.showProgressBar(progress);
        
        // แสดงรายละเอียดของแต่ละ step
        switch(stepIndex) {
            case 0:
                await this.step1_PrepareDocuments();
                break;
            case 1:
                await this.step2_RegisterAndApply();
                break;
            case 2:
                await this.step3_InitialPayment();
                break;
            case 3:
                await this.step4_DocumentReview();
                break;
            case 4:
                await this.step5_AuditPayment();
                break;
            case 5:
                await this.step6_FieldAudit();
                break;
            case 6:
                await this.step7_CertificateIssuance();
                break;
        }
        
        this.journey_steps[stepIndex].status = "completed";
        console.log(chalk.green(`   ✅ เสร็จสิ้น Phase ${step.step}`));
    }

    async step1_PrepareDocuments() {
        console.log(chalk.cyan('\n📄 การเตรียมเอกสาร:'));
        
        const documents = [
            "บัตรประชาชน",
            "โฉนดที่ดิน", 
            "แผนที่แปลงปลูก",
            "รายการสมุนไพร",
            "ข้อมูลแหล่งน้ำ",
            "ผลตรวจสอบดิน"
        ];
        
        for (const doc of documents) {
            await this.sleep(300);
            console.log(chalk.white(`   ✅ ${doc}`));
        }
        
        await this.promptContinue();
    }

    async step2_RegisterAndApply() {
        console.log(chalk.cyan('\n💻 ลงทะเบียนในระบบ:'));
        
        await this.animateProcess([
            "สร้างบัญชีผู้ใช้",
            "ยืนยันตัวตนด้วย OTP",
            "กรอกข้อมูลใบสมัคร",
            "อัพโหลดเอกสาร",
            "ตรวจสอบข้อมูล"
        ]);
        
        this.application.status = "SUBMITTED";
        this.application.id = "GACP-2025-001";
        
        console.log(chalk.green(`\n   🎯 ใบสมัครเลขที่: ${this.application.id}`));
        console.log(chalk.green(`   📅 วันที่ยื่น: ${this.application.created_date}`));
        
        await this.promptContinue();
    }

    async step3_InitialPayment() {
        console.log(chalk.cyan('\n💰 การชำระเงินเริ่มต้น:'));
        
        const feeCalculation = {
            base_fee: 5000,
            discount: 750,
            final_amount: 4250
        };
        
        console.log(`   💵 ค่าธรรมเนียมพื้นฐาน: ${feeCalculation.base_fee.toLocaleString()} บาท`);
        console.log(`   🎁 ส่วนลดเกษตรกรรายเล็ก: ${feeCalculation.discount.toLocaleString()} บาท`);
        console.log(`   💳 จำนวนเงินสุทธิ: ${chalk.yellow.bold(feeCalculation.final_amount.toLocaleString() + ' บาท')}`);
        
        await this.sleep(1000);
        console.log(chalk.cyan('\n📱 สร้าง QR Code สำหรับ PromptPay...'));
        await this.sleep(500);
        console.log(chalk.green('   ✅ QR Code สร้างสำเร็จ'));
        console.log(chalk.green('   ✅ ชำระเงินสำเร็จ'));
        console.log(chalk.green('   📧 ส่งใบเสร็จทาง Email แล้ว'));
        
        await this.promptContinue();
    }

    async step4_DocumentReview() {
        console.log(chalk.cyan('\n📋 การตรวจสอบเอกสาร:'));
        
        await this.animateProcess([
            "เจ้าหน้าที่รับเรื่อง",
            "ตรวจสอบความถูกต้องเอกสาร",
            "ตรวจสอบแผนที่แปลง",
            "ประเมินความเหมาะสมสมุนไพร",
            "ตรวจสอบแหล่งน้ำ"
        ]);
        
        await this.sleep(1000);
        
        // Simulate document review result
        const reviewResult = Math.random() > 0.2; // 80% chance of approval
        
        if (reviewResult) {
            console.log(chalk.green('\n   ✅ เอกสารผ่านการตรวจสอบ'));
            console.log(chalk.green('   📅 นัดหมายวันตรวจประเมิน: 15 ตุลาคม 2025'));
        } else {
            console.log(chalk.red('\n   ❌ เอกสารต้องแก้ไข'));
            console.log(chalk.yellow('   📝 สาเหตุ: แผนที่แปลงไม่ชัดเจน'));
            console.log(chalk.cyan('   🔄 ส่งเอกสารใหม่หลังแก้ไข...'));
            await this.sleep(1000);
            console.log(chalk.green('   ✅ เอกสารผ่านการตรวจสอบ (รอบ 2)'));
        }
        
        await this.promptContinue();
    }

    async step5_AuditPayment() {
        console.log(chalk.cyan('\n💰 การชำระค่าตรวจประเมิน:'));
        
        const auditFee = {
            base_audit: 25000,
            travel_cost: 2000,
            total: 27000
        };
        
        console.log(`   🔍 ค่าตรวจประเมินพื้นฐาน: ${auditFee.base_audit.toLocaleString()} บาท`);
        console.log(`   🚗 ค่าเดินทางเจ้าหน้าที่: ${auditFee.travel_cost.toLocaleString()} บาท`);
        console.log(`   💳 รวมทั้งสิ้น: ${chalk.yellow.bold(auditFee.total.toLocaleString() + ' บาท')}`);
        
        await this.sleep(1000);
        console.log(chalk.green('\n   ✅ ชำระเงินสำเร็จ'));
        console.log(chalk.green('   📞 เจ้าหน้าที่ติดต่อนัดหมาย'));
        console.log(chalk.green('   📅 วันตรวจประเมิน: 15 ตุลาคม 2025'));
        
        await this.promptContinue();
    }

    async step6_FieldAudit() {
        console.log(chalk.cyan('\n🔍 การตรวจประเมินภาคสนาม:'));
        console.log(chalk.gray('   📅 วันที่: 15 ตุลาคม 2025'));
        console.log(chalk.gray('   👥 เจ้าหน้าที่: 2 คน'));
        console.log(chalk.gray('   ⏰ เวลา: 09:00 - 17:00 น.\n'));
        
        const auditActivities = [
            { time: "09:00", activity: "ประชุมเบื้องต้น", score: null },
            { time: "10:00", activity: "สำรวจพื้นที่แปลง", score: 85 },
            { time: "11:30", activity: "ตรวจสอบคุณภาพดินและน้ำ", score: 90 },
            { time: "14:00", activity: "ตรวจสอบวิธีการปลูก", score: 80 },
            { time: "15:30", activity: "ตรวจสอบการเก็บรักษา", score: 82 },
            { time: "16:30", activity: "สรุปผลการประเมิน", score: null }
        ];
        
        for (const activity of auditActivities) {
            await this.sleep(800);
            console.log(chalk.white(`   ${activity.time} - ${activity.activity}`));
            if (activity.score) {
                console.log(chalk.yellow(`          คะแนน: ${activity.score}/100`));
            }
        }
        
        await this.sleep(1000);
        
        const overallScore = 83.7;
        const passed = overallScore >= 75;
        
        console.log(chalk.cyan('\n📊 ผลการประเมิน:'));
        console.log(`   🏆 คะแนนรวม: ${chalk.bold(overallScore)}/100`);
        console.log(`   📏 เกณฑ์ผ่าน: 75/100`);
        
        if (passed) {
            console.log(chalk.green(`   ✅ ผ่านการตรวจประเมิน`));
            console.log(chalk.green(`   🏅 ระดับใบรับรอง: STANDARD`));
            console.log(chalk.green(`   📅 อายุใบรับรอง: 3 ปี`));
        } else {
            console.log(chalk.red(`   ❌ ไม่ผ่านการตรวจประเมิน`));
            console.log(chalk.yellow(`   🔄 สามารถขอตรวจใหม่ได้`));
        }
        
        await this.promptContinue();
    }

    async step7_CertificateIssuance() {
        console.log(chalk.cyan('\n📜 การออกใบรับรอง:'));
        
        await this.animateProcess([
            "เตรียมข้อมูลใบรับรอง",
            "สร้างเลขที่ใบรับรอง",
            "ออกแบบใบรับรอง",
            "ตรวจสอบข้อมูลความถูกต้อง",
            "อนุมัติและลงนาม"
        ]);
        
        console.log(chalk.green('\n🎉 ใบรับรอง GACP ออกเรียบร้อย!'));
        console.log(chalk.white('\n📋 รายละเอียดใบรับรอง:'));
        console.log(`   🏷️  เลขที่: GACP-TH-2025-001`);
        console.log(`   👨‍🌾 ชื่อเกษตรกร: ${this.farmer.name}`);
        console.log(`   📍 ที่ตั้ง: ${this.farmer.location}`);
        console.log(`   🌿 สมุนไพร: ${this.farmer.herbs.join(', ')}`);
        console.log(`   📅 วันที่ออก: 20 ตุลาคม 2025`);
        console.log(`   ⏰ วันหมดอายุ: 20 ตุลาคม 2028`);
        console.log(`   🏆 ระดับ: STANDARD`);
        
        console.log(chalk.yellow('\n📬 การส่งมอบ:'));
        console.log(`   💻 ใบรับรองดิจิทัล: ดาวน์โหลดได้ทันที`);
        console.log(`   📮 ใบรับรองต้นฉบับ: ส่งทางไปรษณีย์ (3-5 วัน)`);
        console.log(`   🎖️  ป้ายแสดงสถานะ GACP: ส่งพร้อมใบรับรอง`);
        
        await this.promptContinue();
    }

    async showFinalResults() {
        console.clear();
        this.showHeader();
        
        console.log(chalk.green.bold('🎉 การขอใบรับรอง GACP เสร็จสิ้นสมบูรณ์! 🎉\n'));
        
        console.log(chalk.cyan('📊 สรุปผลการดำเนินการ:'));
        console.log(chalk.green('   ✅ สถานะ: สำเร็จ'));
        console.log(chalk.green('   📅 ระยะเวลาทั้งหมด: 6 สัปดาห์'));
        console.log(chalk.green('   💰 ค่าใช้จ่ายรวม: 31,250 บาท'));
        console.log(chalk.green('   🏆 ระดับใบรับรอง: STANDARD'));
        console.log(chalk.green('   ⏰ อายุใบรับรอง: 3 ปี\n'));
        
        console.log(chalk.yellow('🌟 ประโยชน์ที่ได้รับ:'));
        console.log(chalk.white('   💰 ขายสินค้าในราคาพรีเมี่ยม (+20%)'));
        console.log(chalk.white('   🌍 เข้าถึงตลาดส่งออก'));
        console.log(chalk.white('   🏛️  ได้รับการสนับสนุนจากรัฐ'));
        console.log(chalk.white('   📈 สร้างแบรนด์และความน่าเชื่อถือ'));
        console.log(chalk.white('   🤝 ได้รับข้อเสนอจากผู้ซื้อคุณภาพ\n'));
        
        console.log(chalk.magenta('💭 คำพูดจากเกษตรกร:'));
        console.log(chalk.italic('"การได้ใบรับรอง GACP เปลี่ยนชีวิตเรามาก'));
        console.log(chalk.italic(' ทั้งราคาขายที่ดีขึ้น และลูกค้าที่มั่นใจในคุณภาพสินค้า'));
        console.log(chalk.italic(' ตอนนี้ลูกชายก็กลับมาทำเกษตรกับพ่อแล้ว"'));
        console.log(chalk.white(`                                    - ${this.farmer.name}\n`));
        
        console.log(chalk.blue('🔗 ขั้นตอนต่อไป:'));
        console.log(chalk.white('   📋 รายงานการผลิตประจำปี'));
        console.log(chalk.white('   🔍 การตรวจสอบประจำปี'));
        console.log(chalk.white('   🔄 การต่ออายุใบรับรอง (ปีที่ 3)'));
        console.log(chalk.white('   📚 การอบรมเพิ่มเติม\n'));
        
        console.log(chalk.green.bold('🌿 ขอบคุณที่ใช้ระบบ GACP! เกษตรกรไทยสู้ๆ! 🇹🇭'));
    }

    showProgressBar(progress) {
        const barLength = 30;
        const filledLength = Math.round((progress / 100) * barLength);
        const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
        console.log(chalk.cyan(`   [${bar}] ${progress}%`));
    }

    async animateProcess(steps) {
        for (const step of steps) {
            await this.sleep(600);
            console.log(chalk.white(`   🔄 ${step}...`));
        }
    }

    async promptContinue() {
        return new Promise((resolve) => {
            this.rl.question(chalk.gray('\n   กด Enter เพื่อดำเนินการต่อ... '), () => {
                resolve();
            });
        });
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// เริ่มต้น Demo
if (require.main === module) {
    const demo = new FarmerJourneyDemo();
    demo.startDemo().catch(console.error);
}

module.exports = FarmerJourneyDemo;