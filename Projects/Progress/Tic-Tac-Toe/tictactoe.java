import java.util.*;
import javafx.application.Application;
import javafx.scene.layout.GridPane;
import javafx.scene.layout.BorderPane;
import javafx.scene.layout.VBox;
import javafx.scene.Scene;
import javafx.stage.Stage;
import javafx.scene.control.Label;
import javafx.scene.control.Button;
import javafx.scene.layout.Background;
import javafx.scene.layout.BackgroundFill;
import javafx.scene.paint.Color;
import javafx.geometry.Pos;
import javafx.scene.text.Font;
import javafx.scene.text.FontWeight;


public class tictactoe extends Application {
    private Label msg=new  Label("Tic-Tac-Toe");
    private Label curplayer=new Label("Current Player: X");
    private Boolean X=true;
    private  int total=0;

    private Button[][] cell = new Button[3][3];

    public void start(Stage stage){
        BorderPane root= new BorderPane();
        {
            VBox top= new VBox();
            top.setAlignment(Pos.CENTER);
            curplayer.setFont(Font.font("Arial", FontWeight.BOLD, 20));
            top.getChildren().addAll(curplayer);
            top.setPrefHeight(35);
            root.setTop(top);
        }
        GridPane grid = new GridPane();
        grid.setBackground(new Background(new BackgroundFill(Color.LIGHTGRAY, null, null)));
        //adding buttons to grid
        for(int i=0;i<3;i++){
            for(int j=0;j<3;j++){
                final int row=i;
                final int col=j;
                cell[i][j]=new Button();
                cell[i][j].setMinSize(65,65);
                cell[i][j].setText(" ");
                cell[i][j].setFont(Font.font("Roboto",FontWeight.BOLD,30));
                cell[row][col].setOnAction(e->{
                    if(cell[row][col].getText().equals(" ")){
                        if(X){
                            cell[row][col].setText("X");
                            curplayer.setText("Current Player: O");
                        } 
                        else{
                            cell[row][col].setText("O");
                            curplayer.setText("Current Player: X");
                        }
                        X=!X;
                    }
                });
                grid.add(cell[i][j],i,j);
            }
        }
        //gird design
        {
            grid.setHgap(5);
            grid.setVgap(5);
            grid.setAlignment(Pos.CENTER);
            root.setCenter(grid);
        }
        Scene scene = new Scene(root,300,400);
        stage.setScene(scene);
        stage.setResizable(false);
        stage.setTitle("Tic-Tac-Toe");
        stage.show(); 
    }   
    
    public static void main(String[] args) {
        launch(args);
    } 

}
