//OPCODES 15
//MEMORY 4k
//Registers
var chip8_rv0 = 0;
var chip8_rv1 = 0;
var chip8_rv2 = 0;
var chip8_rv3 = 0;
var chip8_rv3 = 0;
var chip8_rv4 = 0;
var chip8_rv5 = 0;
var chip8_rv6 = 0;
var chip8_rv7 = 0;
var chip8_rv8 = 0;
var chip8_rv9 = 0;
var chip8_rv10 = 0;
var chip8_rv11 = 0;
var chip8_rv12 = 0;
var chip8_rv13 = 0;
var chip8_rv14 = 0;
var chip8_rve = 0;

function main() {
    setupGraphics();
    setupInput();

    initialize();
    loadGame('pong');
    for (;;) {
        emulateCylce();
        if (this.drawFlag) {
            drawGraphics();
        }
        setKeys();
    }
}

function setupGraphics() {
 //Clear screen

}

function setupInput() {
 //listen
}

function initialize() {
    var pc = 0x200;
    var opcode = 0;
    var I = 0;
    var sp = 0;

    clearDisplay();
    clearStack();
    clearAllRegisters();
    clearMemory();
    
    for(var i =0; i<80; i++) {
        memory[i] = chip8_fontset[i];
    }

    resetTimers();
}

function loadGame(file) {
    var reader = new FileReader();
    reader.readAsBinaryString(file);
}

function emulateCycle() {
    opcode = this.memory[pc] << 8 | memory[pc + 1];

    switch(opcode & 0xF000) {
        case 0xA000:
            I = opcode & 0x0FFF;
            pc += 2;
            break;
        default:
            console.log("Unknown opcode 0x\n" + opcode);

        if(delay_timer > 0)
            --delay_timer;
        
        if(soundtimer > 0) {
            if(sound_timer == 1)
                console.log("BEEP!\n");
            --soundtimer;
        }
    }
}
    }

}

function clearDisplay() {
    var canvas = document.getElementById('canvas');
    var ctx = convas.getContext('2d');
    // FILL WITH BLACK
}

function clearStack() {

}

function clearAllRegisters() {
    var chip8_rv0 = 0;
    var chip8_rv1 = 0;
    var chip8_rv2 = 0;
    var chip8_rv3 = 0;
    var chip8_rv3 = 0;
    var chip8_rv4 = 0;
    var chip8_rv5 = 0;
    var chip8_rv6 = 0;
    var chip8_rv7 = 0;
    var chip8_rv8 = 0;
    var chip8_rv9 = 0;
    var chip8_rv10 = 0;
    var chip8_rv11 = 0;
    var chip8_rv12 = 0;
    var chip8_rv13 = 0;
    var chip8_rv14 = 0;
    var chip8_rve = 0;
}

clearMemory() {
    
}
